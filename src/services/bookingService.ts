import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import type { Paginated } from "@/types/admin";
import type { Prisma, BookingStatus, BookingDocumentType, BookingServiceType } from "@/generated/prisma/client";
import type {
  BookingFlightInput,
  BookingHotelInput,
  BookingActivityInput,
  BookingTransferInput,
  BookingVisaInput,
  BookingInsuranceInput,
  CustomerPaymentInput,
  SupplierPaymentInput,
} from "@/lib/validation/booking";

type Tx = Prisma.TransactionClient;

const BOOKING_INCLUDE = {
  lead: true,
  destination: true,
  quotation: true,
  bookingExecutive: true,
  customerSupport: true,
  documents: { orderBy: { uploadedDate: "desc" as const } },
  flights: { orderBy: { sortOrder: "asc" as const } },
  hotels: { orderBy: { sortOrder: "asc" as const } },
  activities: { orderBy: { sortOrder: "asc" as const } },
  transfers: { orderBy: { sortOrder: "asc" as const } },
  visas: { orderBy: { sortOrder: "asc" as const } },
  insurances: { orderBy: { sortOrder: "asc" as const } },
  costSheet: { orderBy: { sortOrder: "asc" as const } },
  customerPayments: { orderBy: { paymentDate: "desc" as const } },
  supplierPayments: { orderBy: { paymentDate: "desc" as const } },
  timeline: { orderBy: { createdDate: "desc" as const } },
  notes: { orderBy: { createdDate: "desc" as const } },
};

export const bookingCode = (seq: number) => `BK-${seq.toString().padStart(4, "0")}`;

export interface ListQuery {
  search?: string;
  page?: number;
  pageSize?: number;
  filter?: Prisma.BookingWhereInput;
}

export async function listBookings(query: ListQuery = {}) {
  const { search = "", page = 1, pageSize = 10, filter = {} } = query;
  const where: Prisma.BookingWhereInput = { isDeleted: false, ...filter };

  if (search.trim()) {
    where.lead = {
      OR: [
        { customerName: { contains: search, mode: "insensitive" } },
        { mobile: { contains: search, mode: "insensitive" } },
      ],
    };
  }

  const total = await prisma.booking.count({ where });
  const items = await prisma.booking.findMany({
    where,
    include: BOOKING_INCLUDE,
    orderBy: { createdDate: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return { items, total, page, pageSize } satisfies Paginated<(typeof items)[number]>;
}

export async function getBooking(id: string) {
  return prisma.booking.findUnique({ where: { id }, include: BOOKING_INCLUDE });
}

interface BookingInput {
  leadId: string;
  quotationId?: string | null;
  destinationId: string;
  travelDate?: string | null;
  bookingExecutiveId?: string | null;
  customerSupportId?: string | null;
  totalAmount: number;
  remarks?: string | null;
}

export async function createBooking(input: BookingInput) {
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.create({
      data: {
        leadId: input.leadId,
        quotationId: input.quotationId || null,
        destinationId: input.destinationId,
        travelDate: input.travelDate ? new Date(input.travelDate) : null,
        bookingExecutiveId: input.bookingExecutiveId || null,
        customerSupportId: input.customerSupportId || null,
        totalAmount: input.totalAmount,
        remarks: input.remarks,
      },
    });
    await logTimeline(tx, booking.id, "Booking created");
    return tx.booking.findUniqueOrThrow({ where: { id: booking.id }, include: BOOKING_INCLUDE });
  });
}

export async function updateBooking(id: string, input: Partial<BookingInput>) {
  return prisma.booking.update({
    where: { id },
    data: {
      ...(input.quotationId !== undefined && { quotationId: input.quotationId || null }),
      ...(input.destinationId !== undefined && { destinationId: input.destinationId }),
      ...(input.travelDate !== undefined && { travelDate: input.travelDate ? new Date(input.travelDate) : null }),
      ...(input.bookingExecutiveId !== undefined && { bookingExecutiveId: input.bookingExecutiveId || null }),
      ...(input.customerSupportId !== undefined && { customerSupportId: input.customerSupportId || null }),
      ...(input.totalAmount !== undefined && { totalAmount: input.totalAmount }),
      ...(input.remarks !== undefined && { remarks: input.remarks }),
    },
    include: BOOKING_INCLUDE,
  });
}

export async function removeBooking(id: string) {
  return prisma.booking.update({ where: { id }, data: { isDeleted: true } });
}

export async function updateBookingStatus(id: string, status: BookingStatus) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.booking.findUniqueOrThrow({ where: { id } });
    const updated = await tx.booking.update({ where: { id }, data: { status } });
    if (current.status !== status) await logTimeline(tx, id, `Status changed from ${current.status} to ${status}`);
    return tx.booking.findUniqueOrThrow({ where: { id: updated.id }, include: BOOKING_INCLUDE });
  });
}

export async function updateDmcInfo(
  id: string,
  input: { dmcName?: string | null; dmcEmailSentDate?: string | null; dmcResponse?: string | null; dmcRemarks?: string | null },
) {
  return prisma.booking.update({
    where: { id },
    data: {
      dmcName: input.dmcName,
      dmcEmailSentDate: input.dmcEmailSentDate ? new Date(input.dmcEmailSentDate) : null,
      dmcResponse: input.dmcResponse,
      dmcRemarks: input.dmcRemarks,
    },
    include: BOOKING_INCLUDE,
  });
}

/** Appends a Customer Document — multiple files per type are allowed now (no more upsert-by-type). */
export async function addCustomerDocument(bookingId: string, type: BookingDocumentType, url: string) {
  return prisma.$transaction(async (tx) => {
    const doc = await tx.bookingDocument.create({ data: { bookingId, type, url } });
    await logTimeline(tx, bookingId, `Document uploaded: ${type}`);
    return doc;
  });
}

export async function removeCustomerDocument(id: string) {
  return prisma.bookingDocument.delete({ where: { id } });
}

async function logTimeline(tx: Tx, bookingId: string, message: string) {
  await tx.bookingTimelineEvent.create({ data: { bookingId, message } });
}

export async function addBookingNote(bookingId: string, authorName: string, message: string) {
  return prisma.bookingNote.create({ data: { bookingId, authorName, message } });
}

/**
 * Reconciles the Cost Sheet against the six structured service tables — one entry per
 * service row (matched by sourceId), preserving whatever cost figures are already entered,
 * dropping entries whose source row was deleted. Same pattern as the Quotation Pricing
 * step's sourceId reconciliation (src/components/admin/quotation/QuotationBuilder.tsx).
 * Always runs inside the same transaction as whichever replace<Service> call triggered it.
 */
async function reconcileCostSheet(tx: Tx, bookingId: string) {
  // Sequential, not Promise.all — a transaction client holds a single DB connection,
  // so concurrent queries on it race/interleave instead of running in parallel.
  const flights = await tx.bookingFlight.findMany({ where: { bookingId } });
  const hotels = await tx.bookingHotel.findMany({ where: { bookingId } });
  const activities = await tx.bookingActivity.findMany({ where: { bookingId } });
  const transfers = await tx.bookingTransfer.findMany({ where: { bookingId } });
  const visas = await tx.bookingVisa.findMany({ where: { bookingId } });
  const insurances = await tx.bookingInsurance.findMany({ where: { bookingId } });
  const existing = await tx.bookingCostSheetEntry.findMany({ where: { bookingId } });

  const bySource = new Map(existing.map((e) => [e.sourceId, e]));

  const rows: { sourceId: string; serviceType: BookingServiceType; serviceName: string; supplierName: string }[] = [
    ...flights.map((f) => ({ sourceId: f.id, serviceType: "Flight" as const, serviceName: [f.airline, f.flightNumber].filter(Boolean).join(" ") || "Flight", supplierName: f.supplier })),
    ...hotels.map((h) => ({ sourceId: h.id, serviceType: "Hotel" as const, serviceName: h.hotelName || "Hotel", supplierName: h.supplier })),
    ...activities.map((a) => ({ sourceId: a.id, serviceType: "Activity" as const, serviceName: a.activityName || "Activity", supplierName: a.supplier })),
    ...transfers.map((t) => ({ sourceId: t.id, serviceType: "Transfer" as const, serviceName: t.transferType || "Transfer", supplierName: t.supplier })),
    ...visas.map((v) => ({ sourceId: v.id, serviceType: "Visa" as const, serviceName: [v.country, v.visaType].filter(Boolean).join(" ") || "Visa", supplierName: v.supplier })),
    ...insurances.map((i) => ({ sourceId: i.id, serviceType: "Insurance" as const, serviceName: i.insuranceCompany || "Insurance", supplierName: "" })),
  ];

  const liveSourceIds = new Set(rows.map((r) => r.sourceId));
  const staleIds = existing.filter((e) => !liveSourceIds.has(e.sourceId)).map((e) => e.id);
  if (staleIds.length > 0) {
    await tx.bookingCostSheetEntry.deleteMany({ where: { id: { in: staleIds } } });
  }

  for (const [i, row] of rows.entries()) {
    const current = bySource.get(row.sourceId);
    if (current) {
      await tx.bookingCostSheetEntry.update({
        where: { id: current.id },
        data: { serviceName: row.serviceName, supplierName: current.supplierName || row.supplierName, sortOrder: i },
      });
    } else {
      await tx.bookingCostSheetEntry.create({
        data: {
          bookingId,
          serviceType: row.serviceType,
          sourceId: row.sourceId,
          serviceName: row.serviceName,
          supplierName: row.supplierName,
          sortOrder: i,
        },
      });
    }
  }
}

/** Ids to keep — rows the client sent back unchanged/edited get their id preserved so Cost Sheet's sourceId links survive edits. */
function incomingIds(rows: { id?: string }[]): string[] {
  return rows.filter((r) => r.id).map((r) => r.id as string);
}

export async function replaceFlights(bookingId: string, rows: BookingFlightInput[]) {
  return prisma.$transaction(async (tx) => {
    const ids = incomingIds(rows);
    await tx.bookingFlight.deleteMany({ where: ids.length > 0 ? { bookingId, id: { notIn: ids } } : { bookingId } });
    for (const [i, r] of rows.entries()) {
      const id = r.id ?? crypto.randomUUID();
      const data = {
        bookingId, sortOrder: i,
        airline: r.airline, flightNumber: r.flightNumber, pnr: r.pnr, ticketNumber: r.ticketNumber,
        fromLocation: r.fromLocation, toLocation: r.toLocation, departureAt: r.departureAt ?? null, arrivalAt: r.arrivalAt ?? null,
        cabinClass: r.cabinClass, baggage: r.baggage, meal: r.meal, supplier: r.supplier,
        ticketUrl: r.ticketUrl ?? null, voucherUrl: r.voucherUrl ?? null,
      };
      await tx.bookingFlight.upsert({ where: { id }, update: data, create: { id, ...data } });
    }
    await logTimeline(tx, bookingId, `Flights updated (${rows.length} leg${rows.length === 1 ? "" : "s"})`);
    await reconcileCostSheet(tx, bookingId);
    return tx.booking.findUniqueOrThrow({ where: { id: bookingId }, include: BOOKING_INCLUDE });
  });
}

export async function replaceHotels(bookingId: string, rows: BookingHotelInput[]) {
  return prisma.$transaction(async (tx) => {
    const ids = incomingIds(rows);
    await tx.bookingHotel.deleteMany({ where: ids.length > 0 ? { bookingId, id: { notIn: ids } } : { bookingId } });
    for (const [i, r] of rows.entries()) {
      const id = r.id ?? crypto.randomUUID();
      const data = {
        bookingId, sortOrder: i,
        hotelName: r.hotelName, hotelCategory: r.hotelCategory, checkIn: r.checkIn ?? null, checkOut: r.checkOut ?? null,
        nights: r.nights, rooms: r.rooms, roomCategory: r.roomCategory, roomType: r.roomType, mealPlan: r.mealPlan,
        occupancy: r.occupancy, amenities: r.amenities, hotelAddress: r.hotelAddress, googleMapLink: r.googleMapLink ?? null,
        hotelContactNumber: r.hotelContactNumber, supplier: r.supplier, voucherUrl: r.voucherUrl ?? null,
        paymentMode: r.paymentMode, bookingDate: r.bookingDate ?? null, bookingPnr: r.bookingPnr, updatedBy: r.updatedBy,
      };
      await tx.bookingHotel.upsert({ where: { id }, update: data, create: { id, ...data } });
    }
    await logTimeline(tx, bookingId, `Hotels updated (${rows.length})`);
    await reconcileCostSheet(tx, bookingId);
    return tx.booking.findUniqueOrThrow({ where: { id: bookingId }, include: BOOKING_INCLUDE });
  });
}

export async function replaceActivities(bookingId: string, rows: BookingActivityInput[]) {
  return prisma.$transaction(async (tx) => {
    const ids = incomingIds(rows);
    await tx.bookingActivity.deleteMany({ where: ids.length > 0 ? { bookingId, id: { notIn: ids } } : { bookingId } });
    for (const [i, r] of rows.entries()) {
      const id = r.id ?? crypto.randomUUID();
      const data = {
        bookingId, sortOrder: i,
        activityName: r.activityName, activityDate: r.activityDate ?? null, activityTime: r.activityTime, duration: r.duration,
        tourType: r.tourType, pickupIncluded: r.pickupIncluded, pickupTime: r.pickupTime, pax: r.pax,
        inclusions: r.inclusions, exclusions: r.exclusions,
        supplier: r.supplier, voucherUrl: r.voucherUrl ?? null,
        paymentMode: r.paymentMode, bookingDate: r.bookingDate ?? null, bookingPnr: r.bookingPnr, updatedBy: r.updatedBy,
      };
      await tx.bookingActivity.upsert({ where: { id }, update: data, create: { id, ...data } });
    }
    await logTimeline(tx, bookingId, `Activities updated (${rows.length})`);
    await reconcileCostSheet(tx, bookingId);
    return tx.booking.findUniqueOrThrow({ where: { id: bookingId }, include: BOOKING_INCLUDE });
  });
}

export async function replaceTransfers(bookingId: string, rows: BookingTransferInput[]) {
  return prisma.$transaction(async (tx) => {
    const ids = incomingIds(rows);
    await tx.bookingTransfer.deleteMany({ where: ids.length > 0 ? { bookingId, id: { notIn: ids } } : { bookingId } });
    for (const [i, r] of rows.entries()) {
      const id = r.id ?? crypto.randomUUID();
      const data = {
        bookingId, sortOrder: i,
        transferType: r.transferType, vehicleType: r.vehicleType, mode: r.mode, pickupAt: r.pickupAt ?? null,
        pickupLocation: r.pickupLocation, dropLocation: r.dropLocation, driverName: r.driverName, driverMobile: r.driverMobile,
        vehicleNumber: r.vehicleNumber, supplier: r.supplier, voucherUrl: r.voucherUrl ?? null,
        paymentMode: r.paymentMode, bookingDate: r.bookingDate ?? null, bookingPnr: r.bookingPnr, updatedBy: r.updatedBy,
      };
      await tx.bookingTransfer.upsert({ where: { id }, update: data, create: { id, ...data } });
    }
    await logTimeline(tx, bookingId, `Transfers updated (${rows.length})`);
    await reconcileCostSheet(tx, bookingId);
    return tx.booking.findUniqueOrThrow({ where: { id: bookingId }, include: BOOKING_INCLUDE });
  });
}

export async function replaceVisas(bookingId: string, rows: BookingVisaInput[]) {
  return prisma.$transaction(async (tx) => {
    const ids = incomingIds(rows);
    await tx.bookingVisa.deleteMany({ where: ids.length > 0 ? { bookingId, id: { notIn: ids } } : { bookingId } });
    for (const [i, r] of rows.entries()) {
      const id = r.id ?? crypto.randomUUID();
      const data = {
        bookingId, sortOrder: i,
        country: r.country, visaType: r.visaType, visaNumber: r.visaNumber, applicationDate: r.applicationDate ?? null,
        issueDate: r.issueDate ?? null, expiryDate: r.expiryDate ?? null, status: r.status, supplier: r.supplier,
        visaCopyUrl: r.visaCopyUrl ?? null,
      };
      await tx.bookingVisa.upsert({ where: { id }, update: data, create: { id, ...data } });
    }
    await logTimeline(tx, bookingId, `Visas updated (${rows.length})`);
    await reconcileCostSheet(tx, bookingId);
    return tx.booking.findUniqueOrThrow({ where: { id: bookingId }, include: BOOKING_INCLUDE });
  });
}

export async function replaceInsurances(bookingId: string, rows: BookingInsuranceInput[]) {
  return prisma.$transaction(async (tx) => {
    const ids = incomingIds(rows);
    await tx.bookingInsurance.deleteMany({ where: ids.length > 0 ? { bookingId, id: { notIn: ids } } : { bookingId } });
    for (const [i, r] of rows.entries()) {
      const id = r.id ?? crypto.randomUUID();
      const data = {
        bookingId, sortOrder: i,
        insuranceCompany: r.insuranceCompany, policyNumber: r.policyNumber, planName: r.planName, coverageAmount: r.coverageAmount,
        travelStartDate: r.travelStartDate ?? null, travelEndDate: r.travelEndDate ?? null, policyPdfUrl: r.policyPdfUrl ?? null,
      };
      await tx.bookingInsurance.upsert({ where: { id }, update: data, create: { id, ...data } });
    }
    await logTimeline(tx, bookingId, `Insurance updated (${rows.length})`);
    await reconcileCostSheet(tx, bookingId);
    return tx.booking.findUniqueOrThrow({ where: { id: bookingId }, include: BOOKING_INCLUDE });
  });
}

interface CostSheetPatch {
  id: string;
  supplierName?: string;
  dmcCost?: number;
  bookingCost?: number;
  settlementCost?: number;
  sellingPrice?: number;
  status?: "Pending" | "Confirmed" | "Invoiced" | "Settled";
  remarks?: string | null;
}

/** Cost Sheet rows are never created/deleted directly by the user — only their cost figures are edited; reconcileCostSheet owns row lifecycle. */
export async function saveCostSheet(bookingId: string, rows: CostSheetPatch[]) {
  return prisma.$transaction(async (tx) => {
    for (const row of rows) {
      await tx.bookingCostSheetEntry.update({
        where: { id: row.id },
        data: {
          ...(row.supplierName !== undefined && { supplierName: row.supplierName }),
          ...(row.dmcCost !== undefined && { dmcCost: row.dmcCost }),
          ...(row.bookingCost !== undefined && { bookingCost: row.bookingCost }),
          ...(row.settlementCost !== undefined && { settlementCost: row.settlementCost }),
          ...(row.sellingPrice !== undefined && { sellingPrice: row.sellingPrice }),
          ...(row.status !== undefined && { status: row.status }),
          ...(row.remarks !== undefined && { remarks: row.remarks }),
        },
      });
    }
    return tx.booking.findUniqueOrThrow({ where: { id: bookingId }, include: BOOKING_INCLUDE });
  });
}

export async function addCustomerPayment(bookingId: string, input: CustomerPaymentInput) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.bookingCustomerPayment.create({
      data: {
        bookingId,
        paymentDate: input.paymentDate,
        paymentMode: input.paymentMode,
        amount: input.amount,
        transactionReference: input.transactionReference,
        remarks: input.remarks,
      },
    });
    await logTimeline(tx, bookingId, `Customer payment received: ₹${input.amount}`);
    return payment;
  });
}

export async function addSupplierPayment(bookingId: string, input: SupplierPaymentInput) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.bookingSupplierPayment.create({
      data: {
        bookingId,
        supplierName: input.supplierName,
        paymentDate: input.paymentDate,
        amount: input.amount,
        paymentMode: input.paymentMode,
        transactionReference: input.transactionReference,
        settlementStatus: input.settlementStatus,
      },
    });
    await logTimeline(tx, bookingId, `Supplier payment made to ${input.supplierName}: ₹${input.amount}`);
    return payment;
  });
}

/** Called when a Lead is marked Won — creates the Booking automatically, per the spec's "most bookings arrive via the Won trigger." */
export async function createBookingFromWonLead(
  tx: Prisma.TransactionClient,
  lead: { id: string; destinationId: string; travelDate: Date | null },
) {
  const latestQuotation = await tx.quotation.findFirst({
    where: { leadId: lead.id, isDeleted: false },
    orderBy: { createdDate: "desc" },
  });

  const booking = await tx.booking.create({
    data: {
      leadId: lead.id,
      quotationId: latestQuotation?.id ?? null,
      destinationId: lead.destinationId,
      travelDate: lead.travelDate,
    },
  });
  await logTimeline(tx, booking.id, "Booking created automatically from Won lead");
  return booking;
}
