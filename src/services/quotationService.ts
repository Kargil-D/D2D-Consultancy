import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { perfTime } from "@/lib/perf";
import type {
  Paginated,
  ActivityDetail,
  HotelStayDetail,
  ItineraryDayDetail,
  TransferStopDetail,
  QuotationItineraryDay,
  QuotationHotelOptionGroup,
  QuotationTransferItem,
  QuotationActivityItem,
} from "@/types/admin";
import type { Prisma } from "@/generated/prisma/client";
import type { QuotationCreate, QuotationUpdate } from "@/lib/validation/quotation";
import { ApiError } from "@/lib/apiError";
import type { Viewer } from "@/lib/permissions";
import { createLead, updateLead, updateLeadStatus } from "@/services/leadService";
import { findItineraryByPackageId } from "@/services/campaignItineraryService";
import { findHotelByPackageId } from "@/services/campaignHotelService";
import { findTransferByPackageId } from "@/services/campaignTransferService";
import { QUOTE_PREFIX, LEAD_PREFIX, BOOKING_PREFIX, parseSeqCode } from "@/lib/idCodes";
import { listTransferTypes } from "@/services/transferTypeService";

const QUOTATION_INCLUDE = {
  lead: true,
  destination: true,
  campaign: true,
  salesExecutive: true,
  items: { orderBy: { sortOrder: "asc" as const } },
  bookings: { select: { id: true, status: true }, where: { isDeleted: false } },
};

/**
 * The admin list table (`/admin/quotations`) only ever renders `lead`, `destination`, `items`,
 * plus the quotation's own scalar fields — it never reads `campaign`, `salesExecutive`, or
 * `bookings`. Those three are still fetched via the full `QUOTATION_INCLUDE` everywhere the
 * builder/public-share/PDF paths actually need them (they read `campaign.*` for template
 * fallbacks and `bookings` for the "already converted" check), just not here.
 */
const QUOTATION_LIST_INCLUDE = {
  lead: true,
  destination: true,
  items: { orderBy: { sortOrder: "asc" as const } },
};

/** The builder (`/admin/quotations/[id]/edit`) reads only the quotation's own scalars plus
 * `lead`, `items` and `bookings` — it never touches the related `campaign`, `destination` or
 * `salesExecutive` rows (it keeps just their ids). Fetching those relations here dragged the
 * campaign's own itinerary/gallery JSON into every builder load for nothing. */
const QUOTATION_BUILDER_INCLUDE = {
  lead: true,
  items: { orderBy: { sortOrder: "asc" as const } },
  bookings: { select: { id: true, status: true }, where: { isDeleted: false } },
};

/** The all-quotations table renders Quote ID, customer, destination name, selling price and
 * status — never the itineraryDays/hotelOptions/transfers/activities JSON columns, which can
 * carry inline base64 images and dominate the row size. This projection drops them (and the
 * long text fields) so the table payload stays proportional to what it shows. Lead-scoped
 * listings (BookingDetail's cost-sheet import reads those JSON columns) keep using
 * `listQuotations`. */
const QUOTATION_SUMMARY_SELECT = {
  id: true,
  seq: true,
  leadId: true,
  destinationId: true,
  campaignId: true,
  status: true,
  marginPercent: true,
  gstPercent: true,
  travelDate: true,
  travelEndDate: true,
  validUntil: true,
  createdDate: true,
  updatedDate: true,
  lead: { select: { id: true, customerName: true, mobile: true } },
  destination: { select: { id: true, name: true } },
  items: { orderBy: { sortOrder: "asc" as const }, select: { qty: true, cost: true } },
} satisfies Prisma.QuotationSelect;

export type QuotationSummary = Prisma.QuotationGetPayload<{ select: typeof QUOTATION_SUMMARY_SELECT }>;

export interface ListQuery {
  search?: string;
  page?: number;
  pageSize?: number;
  filter?: Prisma.QuotationWhereInput;
}

export function computeTotals(items: { qty: number; cost: number }[], marginPercent: number, gstPercent: number) {
  const totalCost = items.reduce((sum, i) => sum + i.qty * i.cost, 0);
  const marginValue = Math.round(totalCost * (marginPercent / 100));
  const subtotal = totalCost + marginValue;
  const gstValue = Math.round(subtotal * (gstPercent / 100));
  const sellingPrice = subtotal + gstValue;
  return { totalCost, marginValue, subtotal, gstValue, sellingPrice };
}

/** Matches by customer name/mobile as before, plus typed "QT-0013"/"LD-0007"/"BK-0021" codes
 * against this quotation's own seq, its Lead's seq, or any of its Bookings' seq. */
function quotationSearchOr(search: string): Prisma.QuotationWhereInput[] {
  const or: Prisma.QuotationWhereInput[] = [
    { lead: { customerName: { contains: search, mode: "insensitive" } } },
    { lead: { mobile: { contains: search, mode: "insensitive" } } },
  ];
  const quoteSeq = parseSeqCode(search, QUOTE_PREFIX);
  if (quoteSeq !== null) or.push({ seq: quoteSeq });
  const leadSeq = parseSeqCode(search, LEAD_PREFIX);
  if (leadSeq !== null) or.push({ lead: { seq: leadSeq } });
  const bookingSeq = parseSeqCode(search, BOOKING_PREFIX);
  if (bookingSeq !== null) or.push({ bookings: { some: { seq: bookingSeq, isDeleted: false } } });
  return or;
}

/** Admin sees every Quotation; everyone else only the ones where they're the salesExecutive. */
export function quotationVisibilityScope(viewer: Viewer): Prisma.QuotationWhereInput {
  return viewer.isAdmin ? {} : { salesExecutiveId: viewer.id };
}

/** Existence + ownership probe — throws 404 whether the Quotation doesn't exist or isn't visible to this viewer. */
export async function requireQuotationAccess(id: string, viewer: Viewer) {
  const quotation = await prisma.quotation.findFirst({ where: { id, isDeleted: false, ...quotationVisibilityScope(viewer) } });
  if (!quotation) throw new ApiError(404, "Quotation not found");
  return quotation;
}

export async function listQuotations(query: ListQuery = {}, viewer: Viewer) {
  const { search = "", page = 1, pageSize = 10, filter = {} } = query;
  const where: Prisma.QuotationWhereInput = { isDeleted: false, ...quotationVisibilityScope(viewer), ...filter };

  if (search.trim()) {
    where.OR = quotationSearchOr(search.trim());
  }

  const [total, items] = await perfTime(
    "quotationService.listQuotations",
    () =>
      Promise.all([
        prisma.quotation.count({ where }),
        prisma.quotation.findMany({
          where,
          include: QUOTATION_LIST_INCLUDE,
          orderBy: { createdDate: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
      ]),
    ([total, items]) => ({ total, rows: items.length }),
  );

  return { items, total, page, pageSize } satisfies Paginated<(typeof items)[number]>;
}

/** Same filters/paging as listQuotations but with the QUOTATION_SUMMARY_SELECT projection —
 * used by the all-quotations table where full JSON content columns are never rendered. */
export async function listQuotationSummaries(query: ListQuery = {}, viewer: Viewer) {
  const { search = "", page = 1, pageSize = 10, filter = {} } = query;
  const where: Prisma.QuotationWhereInput = { isDeleted: false, ...quotationVisibilityScope(viewer), ...filter };

  if (search.trim()) {
    where.OR = quotationSearchOr(search.trim());
  }

  const [total, items] = await perfTime(
    "quotationService.listQuotationSummaries",
    () =>
      Promise.all([
        prisma.quotation.count({ where }),
        prisma.quotation.findMany({
          where,
          select: QUOTATION_SUMMARY_SELECT,
          orderBy: { createdDate: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
      ]),
    ([total, items]) => ({ total, rows: items.length }),
  );

  return { items, total, page, pageSize } satisfies Paginated<(typeof items)[number]>;
}

export async function getQuotation(id: string) {
  return perfTime(
    "quotationService.getQuotation",
    () => prisma.quotation.findUnique({ where: { id }, include: QUOTATION_INCLUDE }),
    (r) => ({ found: !!r, items: r?.items.length ?? 0 }),
  );
}

/** Lean variant for the admin builder — see QUOTATION_BUILDER_INCLUDE. PDF/share/email paths
 * keep `getQuotation` (they render campaign/destination/salesExecutive details). */
export async function getQuotationForBuilder(id: string) {
  return perfTime(
    "quotationService.getQuotationForBuilder",
    () => prisma.quotation.findUnique({ where: { id }, include: QUOTATION_BUILDER_INCLUDE }),
    (r) => ({ found: !!r, items: r?.items.length ?? 0 }),
  );
}

export async function getQuotationByShareToken(token: string) {
  return perfTime(
    "quotationService.getQuotationByShareToken",
    () =>
      prisma.quotation.findFirst({
        where: { shareToken: token, isDeleted: false },
        include: QUOTATION_INCLUDE,
      }),
    (r) => ({ found: !!r }),
  );
}

const LEAD_PIPELINE_ORDER = ["New", "Contacted", "FollowUp"] as const;

/** Strips formatting so "+91 77083 02280", "917708302280" and "7708302280" all match as the same number. */
function normalizeMobile(mobile: string): string {
  const digits = mobile.replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
}

/**
 * Step 1 has no "pick a lead" dropdown — it's a plain customer-detail form. This finds an
 * existing Lead by mobile match (formatting-insensitive — see normalizeMobile) and refreshes
 * its display fields, or creates a new one, so the Leads pipeline/reporting keeps working
 * untouched. Status only ever moves forward to "QuotationSent" (never downgrades a Lead
 * already further along, e.g. "Won").
 */
export async function findOrCreateLeadForQuotation(
  customer: { customerName: string; mobile: string; email?: string | null; companyName?: string | null },
  destinationId: string,
  source?: string | null,
) {
  const normalized = normalizeMobile(customer.mobile);
  // No index accelerates `endsWith` on a plain btree (Lead.mobile isn't indexed at all today),
  // so this is a full scan over every non-deleted Lead on every quotation save that touches
  // Step 1 — timed here since it's the least obviously-expensive step in the save path.
  const candidates = normalized
    ? await perfTime(
        "quotationService.findOrCreateLeadForQuotation.mobileScan",
        () =>
          prisma.lead.findMany({
            where: { isDeleted: false, mobile: { endsWith: normalized } },
            select: { id: true, mobile: true, customerName: true, email: true, companyName: true, status: true },
          }),
        (r) => ({ scanned: r.length }),
      )
    : [];
  const existing = candidates.find((l) => normalizeMobile(l.mobile) === normalized) ?? null;

  if (existing) {
    const changed =
      existing.customerName !== customer.customerName ||
      (existing.email ?? null) !== (customer.email ?? null) ||
      (existing.companyName ?? null) !== (customer.companyName ?? null);
    const lead = changed
      ? await updateLead(existing.id, {
          customerName: customer.customerName,
          email: customer.email || null,
          companyName: customer.companyName || null,
        })
      : existing;

    if ((LEAD_PIPELINE_ORDER as readonly string[]).includes(lead.status)) {
      await updateLeadStatus(lead.id, "QuotationSent");
      return prisma.lead.findUniqueOrThrow({ where: { id: lead.id } });
    }
    return lead;
  }

  return createLead({
    customerName: customer.customerName,
    mobile: customer.mobile,
    email: customer.email || null,
    companyName: customer.companyName || null,
    destinationId,
    source: (source as Prisma.LeadUncheckedCreateInput["source"]) ?? "Manual",
    status: "QuotationSent",
  });
}

function quotationScalarData(input: Partial<QuotationCreate | QuotationUpdate>) {
  return {
    ...(input.destinationId !== undefined && { destinationId: input.destinationId }),
    ...(input.campaignId !== undefined && { campaignId: input.campaignId || null }),
    ...(input.marginPercent !== undefined && { marginPercent: input.marginPercent }),
    ...(input.gstPercent !== undefined && { gstPercent: input.gstPercent }),
    ...(input.travelDate !== undefined && { travelDate: input.travelDate }),
    ...(input.travelEndDate !== undefined && { travelEndDate: input.travelEndDate }),
    ...(input.days !== undefined && { days: input.days }),
    ...(input.nights !== undefined && { nights: input.nights }),
    ...(input.adults !== undefined && { adults: input.adults }),
    ...(input.children !== undefined && { children: input.children }),
    ...(input.infants !== undefined && { infants: input.infants }),
    ...(input.salesExecutiveId !== undefined && { salesExecutiveId: input.salesExecutiveId || null }),
    ...(input.source !== undefined && { source: input.source }),
    ...(input.validUntil !== undefined && { validUntil: input.validUntil }),
    ...(input.internalNotes !== undefined && { internalNotes: input.internalNotes }),
    ...(input.itineraryMode !== undefined && { itineraryMode: input.itineraryMode }),
    ...(input.itineraryDays !== undefined && { itineraryDays: input.itineraryDays as Prisma.InputJsonValue }),
    ...(input.hotelOptions !== undefined && { hotelOptions: input.hotelOptions as Prisma.InputJsonValue }),
    ...(input.transfers !== undefined && { transfers: input.transfers as Prisma.InputJsonValue }),
    ...(input.activities !== undefined && { activities: input.activities as Prisma.InputJsonValue }),
    ...(input.inclusionsText !== undefined && { inclusionsText: input.inclusionsText }),
    ...(input.exclusionsText !== undefined && { exclusionsText: input.exclusionsText }),
    ...(input.includeChildCosting !== undefined && { includeChildCosting: input.includeChildCosting }),
    ...(input.advanceAmount !== undefined && { advanceAmount: input.advanceAmount }),
  } satisfies Prisma.QuotationUncheckedUpdateInput;
}

/** Quotation content (itineraryDays/hotelOptions/transfers/activities) can carry sizeable
 * base64-encoded images inline, which makes these writes slow enough on production DB latency
 * to blow past Prisma's 5s default interactive-transaction timeout — hence the longer timeout. */
const QUOTATION_TRANSACTION_OPTIONS = { timeout: 20_000 };

export async function createQuotation(input: QuotationCreate) {
  const lead = await findOrCreateLeadForQuotation(input.customer, input.destinationId, input.source);

  return prisma.$transaction(async (tx) => {
    const quotation = await tx.quotation.create({
      data: {
        leadId: lead.id,
        ...quotationScalarData(input),
      } as Prisma.QuotationUncheckedCreateInput,
    });
    if (input.items.length > 0) {
      await tx.quotationItem.createMany({
        data: input.items.map((item, i) => ({
          quotationId: quotation.id,
          sourceId: item.sourceId ?? null,
          component: item.component,
          detail: item.detail ?? "",
          qty: item.qty,
          cost: item.cost,
          currencyCode: item.currencyCode ?? "INR",
          foreignAmount: item.foreignAmount ?? null,
          exchangeRate: item.exchangeRate ?? 1,
          sortOrder: item.sortOrder ?? i,
        })),
      });
    }
    return tx.quotation.findUniqueOrThrow({ where: { id: quotation.id }, include: QUOTATION_INCLUDE });
  }, QUOTATION_TRANSACTION_OPTIONS);
}

export async function updateQuotation(id: string, input: QuotationUpdate) {
  if (input.customer) {
    const current = await prisma.quotation.findUniqueOrThrow({
      where: { id },
      select: { leadId: true, destinationId: true, lead: { select: { mobile: true, customerName: true, email: true, companyName: true, status: true } } },
    });
    // Fast path: the customer fields still match the already-linked Lead AND its status is
    // already past the early pipeline stages — the find-or-create (whose mobile lookup is an
    // unindexed scan over every Lead) would be a pure no-op, so skip it. Any difference,
    // including a pipeline status that still needs advancing to QuotationSent, falls through
    // to the full find-or-create exactly as before.
    const unchanged =
      !(LEAD_PIPELINE_ORDER as readonly string[]).includes(current.lead.status) &&
      normalizeMobile(current.lead.mobile) === normalizeMobile(input.customer.mobile) &&
      current.lead.customerName === input.customer.customerName &&
      (current.lead.email ?? null) === (input.customer.email || null) &&
      (current.lead.companyName ?? null) === (input.customer.companyName || null);
    if (!unchanged) {
      const lead = await findOrCreateLeadForQuotation(
        input.customer,
        input.destinationId ?? current.destinationId,
        input.source,
      );
      if (lead.id !== current.leadId) {
        await prisma.quotation.update({ where: { id }, data: { leadId: lead.id } });
      }
    }
  }

  return perfTime(
    "quotationService.updateQuotation",
    () =>
      prisma.$transaction(async (tx) => {
        await tx.quotation.update({ where: { id }, data: quotationScalarData(input) });
        if (input.items) {
          await tx.quotationItem.deleteMany({ where: { quotationId: id } });
          if (input.items.length > 0) {
            await tx.quotationItem.createMany({
              data: input.items.map((item, i) => ({
                quotationId: id,
                sourceId: item.sourceId ?? null,
                component: item.component,
                detail: item.detail ?? "",
                qty: item.qty,
                cost: item.cost,
                currencyCode: item.currencyCode ?? "INR",
                foreignAmount: item.foreignAmount ?? null,
                exchangeRate: item.exchangeRate ?? 1,
                sortOrder: item.sortOrder ?? i,
              })),
            });
          }
        }
        // Slim acknowledgement instead of echoing the whole record (whose JSON content the
        // client just sent us) back through QUOTATION_INCLUDE — the builder only reads
        // updatedDate from a save response.
        return tx.quotation.findUniqueOrThrow({
          where: { id },
          select: { id: true, updatedDate: true, status: true, shareToken: true },
        });
      }, QUOTATION_TRANSACTION_OPTIONS),
    () => ({ replacedItems: !!input.items }),
  );
}

export async function removeQuotation(id: string) {
  return prisma.quotation.update({ where: { id }, data: { isDeleted: true } });
}

export async function duplicateQuotation(id: string) {
  const source = await prisma.quotation.findUniqueOrThrow({ where: { id }, include: { items: true } });
  return prisma.$transaction(async (tx) => {
    const copy = await tx.quotation.create({
      data: {
        leadId: source.leadId,
        destinationId: source.destinationId,
        campaignId: source.campaignId,
        marginPercent: source.marginPercent,
        gstPercent: source.gstPercent,
        travelDate: source.travelDate,
        days: source.days,
        nights: source.nights,
        adults: source.adults,
        children: source.children,
        infants: source.infants,
        salesExecutiveId: source.salesExecutiveId,
        source: source.source,
        validUntil: source.validUntil,
        internalNotes: source.internalNotes,
        itineraryMode: source.itineraryMode,
        itineraryDays: source.itineraryDays as Prisma.InputJsonValue,
        hotelOptions: source.hotelOptions as Prisma.InputJsonValue,
        transfers: source.transfers as Prisma.InputJsonValue,
        activities: source.activities as Prisma.InputJsonValue,
        inclusionsText: source.inclusionsText,
        exclusionsText: source.exclusionsText,
        includeChildCosting: source.includeChildCosting,
      },
    });
    if (source.items.length > 0) {
      await tx.quotationItem.createMany({
        data: source.items.map((item) => ({
          quotationId: copy.id,
          sourceId: item.sourceId,
          component: item.component,
          detail: item.detail,
          qty: item.qty,
          cost: item.cost,
          currencyCode: item.currencyCode,
          foreignAmount: item.foreignAmount,
          exchangeRate: item.exchangeRate,
          sortOrder: item.sortOrder,
        })),
      });
    }
    return tx.quotation.findUniqueOrThrow({ where: { id: copy.id }, include: QUOTATION_INCLUDE });
  }, QUOTATION_TRANSACTION_OPTIONS);
}

/**
 * Idempotent: reuses the existing shareToken if one was already issued, instead of minting a
 * new one on every call. A fresh token would silently 404 any link already shared with the
 * customer (e.g. over WhatsApp), since the old token stops matching any row.
 */
export async function generateShareLink(id: string) {
  const existing = await prisma.quotation.findUniqueOrThrow({ where: { id }, select: { shareToken: true } });
  const token = existing.shareToken ?? crypto.randomBytes(24).toString("hex");
  const quotation = await prisma.quotation.update({
    where: { id },
    data: { shareToken: token, status: "Sent" },
  });
  return quotation.shareToken as string;
}

export async function markQuotationSent(id: string) {
  return prisma.quotation.update({ where: { id }, data: { status: "Sent" } });
}

/** No PDF file is persisted — each hit of the PDF route re-renders on the fly — so this just
 * stamps "last generated at" for the Document Status panel. */
export async function markPdfGenerated(id: string) {
  const quotation = await prisma.quotation.update({ where: { id }, data: { pdfGeneratedAt: new Date() } });
  return quotation.pdfGeneratedAt as Date;
}

export const quoteCode = (seq: number) => `QT-${seq.toString().padStart(4, "0")}`;

function textToLines(text: string): string[] {
  return text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
}

/** Maps a legacy Campaign-template day into the wizard's own day shape, for quotations that never used Step 2. */
function dayFromCampaign(d: ItineraryDayDetail): QuotationItineraryDay {
  const notes = [d.stayDetails, d.transportDetails].filter(Boolean).join(" — ");
  return {
    id: d.id,
    dayNumber: d.dayNumber,
    title: d.title,
    description: d.description,
    images: d.dayImage ? [d.dayImage] : [],
    meals: d.mealsIncluded,
    notes,
  };
}

/** Maps legacy Campaign hotels into a single "Option A" group, for quotations that never used Step 3. */
function hotelOptionsFromCampaign(hotels: HotelStayDetail[]): QuotationHotelOptionGroup[] {
  if (hotels.length === 0) return [];
  return [
    {
      id: "campaign-hotels",
      label: "Option A",
      hotels: hotels.map((h) => ({
        id: h.id,
        hotelMasterId: h.hotelMasterId ?? null,
        hotelName: h.name,
        images: h.images ?? [],
        description: h.description,
        category: null,
        roomType: h.roomType,
        mealPlan: h.mealPlan ?? "",
        amenities: h.amenities ?? [],
        googleMapUrl: null,
        website: null,
        checkIn: "",
        checkOut: "",
        rooms: 1,
        nights: 0,
      })),
    },
  ];
}

/** Maps legacy Campaign transfers into the wizard's own transfer shape, for quotations that never used Step 4. */
function transfersFromCampaign(transfers: (TransferStopDetail & { typeName: string })[]): QuotationTransferItem[] {
  return transfers.map((t) => ({
    id: t.id,
    name: t.typeName,
    description: "",
    images: [],
    pickupLocation: t.from,
    dropLocation: t.to,
    vehicleType: t.typeName,
    mode: "Private",
    transferDate: "",
    duration: "",
    pickupTime: "",
    dropTime: "",
    status: "Included",
    notes: "",
  }));
}

/** Maps legacy Campaign activities into the wizard's own activity shape, for quotations that never used Step 5. */
function activitiesFromCampaign(activities: ActivityDetail[]): QuotationActivityItem[] {
  return activities.map((a) => ({
    id: a.id,
    name: a.title,
    description: "",
    images: [],
    activityDate: "",
    duration: "",
    reportingTime: "",
    activityTime: "",
    pax: 0,
    notes: "",
  }));
}

/**
 * The single source of truth for anything shown to the customer (PDF, email, public share
 * link) — strips every internal cost/margin field, only the final selling price survives.
 *
 * Itinerary/Hotels/Transfers/Activities come from the quotation's own Step 2–5 content
 * first; a quotation built from a Campaign template before those steps existed (or one
 * where a step was simply left empty) falls back to that campaign's own itinerary/hotel/
 * transfer/activity data instead, mapped into the same shape so the renderer never has to
 * care which source it came from.
 */
export async function buildPublicQuoteData(quotation: NonNullable<Awaited<ReturnType<typeof getQuotation>>>) {
  const { subtotal, sellingPrice } = computeTotals(quotation.items, quotation.marginPercent, quotation.gstPercent);

  let itineraryDays = quotation.itineraryDays as unknown as QuotationItineraryDay[];
  let hotelOptions = quotation.hotelOptions as unknown as QuotationHotelOptionGroup[];
  let transfers = quotation.transfers as unknown as QuotationTransferItem[];
  let activities = quotation.activities as unknown as QuotationActivityItem[];
  let heroImage = quotation.destination.bannerImage || quotation.destination.thumbnailImage || "";
  let inclusionLines: string[] = textToLines(quotation.inclusionsText || "");
  let exclusionLines: string[] = textToLines(quotation.exclusionsText || "");

  const campaign = quotation.campaign;
  const needsFallback = itineraryDays.length === 0 || hotelOptions.length === 0 || transfers.length === 0 || activities.length === 0;

  if (campaign && needsFallback) {
    const [itinerary, hotelPlan, transferPlan, transferTypesRes] = await Promise.all([
      findItineraryByPackageId(campaign.id),
      findHotelByPackageId(campaign.id),
      findTransferByPackageId(campaign.id),
      listTransferTypes({ pageSize: 1000 }),
    ]);
    const transferTypeNameById = new Map(transferTypesRes.items.map((t) => [t.id, t.name]));
    const campaignDays = (itinerary?.days as unknown as ItineraryDayDetail[] | undefined) ?? [];
    const campaignHotels = (hotelPlan?.hotels as unknown as HotelStayDetail[] | undefined) ?? [];
    const campaignTransfers = (transferPlan?.transfers as unknown as TransferStopDetail[] | undefined) ?? [];
    const campaignActivities = (campaign.activities as unknown as ActivityDetail[] | undefined) ?? [];

    if (itineraryDays.length === 0) itineraryDays = campaignDays.map(dayFromCampaign);
    if (hotelOptions.length === 0) hotelOptions = hotelOptionsFromCampaign(campaignHotels);
    if (transfers.length === 0) {
      transfers = transfersFromCampaign(
        campaignTransfers.map((t) => ({ ...t, typeName: (t.transferTypeId && transferTypeNameById.get(t.transferTypeId)) || "Transfer" })),
      );
    }
    if (activities.length === 0) activities = activitiesFromCampaign(campaignActivities);

    heroImage = campaign.coverBanner || campaign.thumbnail || heroImage;
    if (inclusionLines.length === 0) inclusionLines = textToLines(campaign.inclusionsText || "");
    if (exclusionLines.length === 0) exclusionLines = textToLines(campaign.exclusionsText || "");
  }

  const days = quotation.days ?? campaign?.days ?? null;
  const nights = quotation.nights ?? campaign?.nights ?? null;
  const travelStartDate = quotation.travelDate ?? quotation.lead.travelDate ?? null;
  // Prefer the admin-entered end date; fall back to deriving it from trip length for older
  // quotations saved before travelEndDate existed (nights preferred, else days - 1).
  const stayLengthDays = nights ?? (days ? days - 1 : null);
  const travelEndDate =
    quotation.travelEndDate ??
    (travelStartDate && stayLengthDays != null
      ? new Date(travelStartDate.getTime() + stayLengthDays * 24 * 60 * 60 * 1000)
      : null);

  return {
    quoteCode: quoteCode(quotation.seq),
    customerName: quotation.lead.customerName,
    destinationName: quotation.destination.name,
    packageName: campaign?.name ?? null,
    importantNotes: quotation.destination.importantNotes || null,
    heroImage,
    travelDate: travelStartDate ? travelStartDate.toLocaleDateString("en-IN") : null,
    travelEndDate: travelEndDate ? travelEndDate.toLocaleDateString("en-IN") : null,
    days,
    nights,
    adults: quotation.adults,
    children: quotation.children,
    infants: quotation.infants,
    validUntil: quotation.validUntil ? quotation.validUntil.toLocaleDateString("en-IN") : null,
    createdDate: quotation.createdDate.toLocaleDateString("en-IN"),
    itineraryDays,
    hotelOptions,
    transfers,
    activities,
    inclusionLines,
    exclusionLines,
    subtotal,
    gstPercent: quotation.gstPercent,
    includeChildCosting: quotation.includeChildCosting,
    sellingPrice,
    status: quotation.status,
    advanceAmount: quotation.advanceAmount,
    // Campaign no longer has a highlights field (removed from the admin form/table) — the PDF's
    // "Trip Highlights" section is guarded by `hasHighlights` and simply won't render.
    highlights: [],
  };
}

export type PublicQuoteData = Awaited<ReturnType<typeof buildPublicQuoteData>>;
