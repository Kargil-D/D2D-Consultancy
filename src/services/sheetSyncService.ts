import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/apiError";
import { trackingCode } from "@/lib/idCodes";
import { bookingTotalPrice, computeQuotationPricing } from "@/lib/quotationPricing";
import { isGoogleSheetsConfigured, toSheetDate, writeTabSnapshot, type CellValue, type ColumnFormat } from "@/lib/googleSheets";
import { SHEET_TARGETS, type SheetTarget } from "@/lib/validation/sheetSync";

/**
 * Mirrors Leads and Bookings (one row per Booking) into two Google Sheets (GOOGLE_SHEET_ID_LEADS,
 * GOOGLE_SHEET_ID_BOOKINGS) for staff without an admin login. The database stays the source of
 * truth: every sync overwrites the "Leads" / "Bookings" tab in full, so edits made directly in
 * those tabs are lost on the next run — put formulas/notes in other tabs.
 *
 * Column headers match the CSV exports the team already used (leads-*.csv / customers-*.csv).
 * Columns with no backing field in the database yet (Priority, Starred, Budget, …) are written
 * blank so the layout stays identical.
 */

const LEADS_TAB = "Leads";
const BOOKINGS_TAB = "Bookings";

interface SheetColumn<T> {
  header: string;
  format: ColumnFormat;
  value: (row: T) => CellValue;
}

const blank = (): CellValue => null;

/** "QuotationSent" → "Quotation Sent", "MetaAds" → "Meta Ads", "SEO" → "SEO". */
const humanize = (value: string) => value.replace(/([a-z])([A-Z])/g, "$1 $2");

const sheetUrl = (id: string) => `https://docs.google.com/spreadsheets/d/${id}/edit`;

function getSpreadsheetIds(): { leads: string; bookings: string } | null {
  const leads = process.env.GOOGLE_SHEET_ID_LEADS;
  const bookings = process.env.GOOGLE_SHEET_ID_BOOKINGS;
  if (!leads || !bookings || !isGoogleSheetsConfigured()) return null;
  return { leads, bookings };
}

export function getSheetSyncStatus() {
  const ids = getSpreadsheetIds();
  return {
    configured: !!ids,
    leadsSheetUrl: ids ? sheetUrl(ids.leads) : null,
    bookingsSheetUrl: ids ? sheetUrl(ids.bookings) : null,
  };
}

/* ------------------------------------------------------------------------ */
/*  Leads — one row per Lead                                                 */
/* ------------------------------------------------------------------------ */

function fetchLeads() {
  return prisma.lead.findMany({
    where: { isDeleted: false },
    orderBy: { seq: "asc" },
    select: {
      customerName: true,
      mobile: true,
      email: true,
      status: true,
      source: true,
      travelDate: true,
      adults: true,
      children: true,
      createdDate: true,
      updatedDate: true,
      destination: { select: { name: true } },
      // Latest quotation supplies trip length and the quoted price.
      quotations: {
        where: { isDeleted: false },
        orderBy: { createdDate: "desc" },
        take: 1,
        select: {
          departureDate: true,
          travelDate: true,
          nights: true,
          days: true,
          adults: true,
          children: true,
          marginPercent: true,
          gstPercent: true,
          items: { select: { qty: true, cost: true } },
        },
      },
    },
  });
}

type LeadRow = Awaited<ReturnType<typeof fetchLeads>>[number];

const LEAD_COLUMNS: SheetColumn<LeadRow>[] = [
  { header: "Name", format: "text", value: (l) => l.customerName },
  { header: "Phone", format: "text", value: (l) => l.mobile },
  { header: "Email", format: "text", value: (l) => l.email },
  { header: "Destinations", format: "text", value: (l) => l.destination.name },
  { header: "Stage", format: "text", value: (l) => humanize(l.status) },
  { header: "Priority", format: "text", value: blank },
  { header: "Source", format: "text", value: (l) => humanize(l.source) },
  { header: "Trip type", format: "text", value: blank },
  {
    header: "Departure",
    format: "date",
    value: (l) => toSheetDate(l.quotations[0]?.departureDate ?? l.quotations[0]?.travelDate ?? l.travelDate),
  },
  { header: "Nights", format: "number", value: (l) => l.quotations[0]?.nights ?? null },
  { header: "Days", format: "number", value: (l) => l.quotations[0]?.days ?? null },
  { header: "Adults", format: "number", value: (l) => l.adults ?? l.quotations[0]?.adults ?? null },
  { header: "Children", format: "number", value: (l) => l.children ?? l.quotations[0]?.children ?? null },
  { header: "Rooms", format: "number", value: blank },
  { header: "Budget", format: "number", value: blank },
  {
    header: "Quoted",
    format: "number",
    value: (l) => (l.quotations[0] ? computeQuotationPricing(l.quotations[0]).dealPrice || null : null),
  },
  { header: "Currency", format: "text", value: () => "INR" },
  { header: "Follow-up", format: "date", value: blank },
  { header: "Starred", format: "text", value: blank },
  { header: "Hot", format: "text", value: blank },
  { header: "Qualified", format: "text", value: blank },
  { header: "Lost reason", format: "text", value: blank },
  { header: "Created", format: "date", value: (l) => toSheetDate(l.createdDate) },
  { header: "Updated", format: "date", value: (l) => toSheetDate(l.updatedDate) },
];

/* ------------------------------------------------------------------------ */
/*  Bookings — one row per Booking (customers-*.csv layout)                 */
/* ------------------------------------------------------------------------ */

function fetchBookings() {
  return prisma.booking.findMany({
    where: { isDeleted: false },
    orderBy: { seq: "asc" },
    select: {
      status: true,
      travelDate: true,
      adults: true,
      children: true,
      infants: true,
      totalAmount: true,
      createdDate: true,
      lead: { select: { customerName: true, mobile: true, email: true, seq: true } },
      destination: { select: { name: true } },
      quotation: {
        select: { travelEndDate: true, marginPercent: true, gstPercent: true, items: { select: { qty: true, cost: true } } },
      },
      hotels: { select: { checkIn: true, checkOut: true } },
      flights: { select: { departureAt: true }, orderBy: { departureAt: "asc" } },
      customerPayments: { select: { amount: true } },
      _count: { select: { documents: true } },
    },
  });
}

type BookingRow = Awaited<ReturnType<typeof fetchBookings>>[number];

interface BookingSheetRow extends BookingRow {
  value: number | null;
  received: number;
}

function earliest(dates: (Date | null)[]): Date | null {
  return dates.reduce<Date | null>((min, d) => (d && (!min || d < min) ? d : min), null);
}

function latest(dates: (Date | null)[]): Date | null {
  return dates.reduce<Date | null>((max, d) => (d && (!max || d > max) ? d : max), null);
}

/** With 2+ flights the last one is the return leg; otherwise fall back to the quotation's trip end date. */
function returnDate(b: BookingSheetRow): Date | null {
  const departures = b.flights.map((f) => f.departureAt).filter((d): d is Date => !!d);
  if (departures.length >= 2) return departures[departures.length - 1];
  return b.quotation?.travelEndDate ?? null;
}

function paymentStatus(b: BookingSheetRow): string | null {
  if (b.value === null) return null;
  if (b.received <= 0) return "Unpaid";
  return b.received >= b.value ? "Paid" : "Partial";
}

const BOOKING_COLUMNS: SheetColumn<BookingSheetRow>[] = [
  { header: "Name", format: "text", value: (b) => b.lead.customerName },
  { header: "Phone", format: "text", value: (b) => b.lead.mobile },
  { header: "Email", format: "text", value: (b) => b.lead.email },
  { header: "Destinations", format: "text", value: (b) => b.destination.name },
  { header: "Stage", format: "text", value: (b) => humanize(b.status) },
  { header: "Departure", format: "date", value: (b) => toSheetDate(b.travelDate ?? b.flights[0]?.departureAt) },
  { header: "Check-in", format: "date", value: (b) => toSheetDate(earliest(b.hotels.map((h) => h.checkIn))) },
  { header: "Check-out", format: "date", value: (b) => toSheetDate(latest(b.hotels.map((h) => h.checkOut))) },
  { header: "Return", format: "date", value: (b) => toSheetDate(returnDate(b)) },
  { header: "Booking value", format: "number", value: (b) => b.value },
  { header: "Received", format: "number", value: (b) => b.received },
  { header: "Balance", format: "number", value: (b) => (b.value === null ? null : b.value - b.received) },
  { header: "Currency", format: "text", value: () => "INR" },
  { header: "Payment status", format: "text", value: paymentStatus },
  { header: "Payment due", format: "date", value: blank },
  { header: "Documents done", format: "number", value: (b) => b._count.documents },
  { header: "Booking refs", format: "text", value: (b) => trackingCode(b.lead.seq) },
  { header: "Travellers", format: "number", value: (b) => b.adults + b.children + b.infants },
  { header: "Follow-up", format: "date", value: blank },
  { header: "Starred", format: "text", value: blank },
  { header: "Created", format: "date", value: (b) => toSheetDate(b.createdDate) },
];

/* ------------------------------------------------------------------------ */

function toTab<T>(title: string, columns: SheetColumn<T>[], rows: T[]) {
  return {
    title,
    headers: columns.map((c) => c.header),
    formats: columns.map((c) => c.format),
    rows: rows.map((r) => columns.map((c) => c.value(r))),
  };
}

export interface SheetSyncResult {
  syncedAt: string;
  /** Rows written per synced sheet; a sheet that wasn't part of this sync is absent. */
  rows: Partial<Record<SheetTarget, number>>;
}

async function syncLeads(spreadsheetId: string): Promise<number> {
  const leads = await fetchLeads();
  await writeTabSnapshot(spreadsheetId, toTab(LEADS_TAB, LEAD_COLUMNS, leads));
  return leads.length;
}

async function syncBookings(spreadsheetId: string): Promise<number> {
  const bookings = await fetchBookings();
  const rows: BookingSheetRow[] = bookings.map((b) => ({
    ...b,
    value: bookingTotalPrice(b),
    received: b.customerPayments.reduce((sum, p) => sum + p.amount, 0),
  }));
  await writeTabSnapshot(spreadsheetId, toTab(BOOKINGS_TAB, BOOKING_COLUMNS, rows));
  return rows.length;
}

/** Rewrites the given sheets (both by default — the daily cron). Sequential, to stay well under
 * the Sheets API's per-minute write quota, which is shared across the project. */
export async function syncGoogleSheets(targets: readonly SheetTarget[] = SHEET_TARGETS): Promise<SheetSyncResult> {
  const ids = getSpreadsheetIds();
  if (!ids) throw new ApiError(500, "Google Sheet sync is not configured");
  const rows: SheetSyncResult["rows"] = {};
  if (targets.includes("leads")) rows.leads = await syncLeads(ids.leads);
  if (targets.includes("bookings")) rows.bookings = await syncBookings(ids.bookings);
  return { syncedAt: new Date().toISOString(), rows };
}
