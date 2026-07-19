import { prisma } from "@/lib/prisma";
import type { Paginated } from "@/types/admin";
import type { Prisma, BookingStatus, BookingDocumentType } from "@/generated/prisma/client";
import type { ComponentUpsert } from "@/lib/validation/booking";

const BOOKING_INCLUDE = {
  lead: true,
  destination: true,
  quotation: true,
  bookingExecutive: true,
  customerSupport: true,
  documents: true,
  components: { orderBy: { sortOrder: "asc" as const } },
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
  return prisma.booking.create({
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
    include: BOOKING_INCLUDE,
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
  return prisma.booking.update({ where: { id }, data: { status }, include: BOOKING_INCLUDE });
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

export async function upsertDocument(bookingId: string, type: BookingDocumentType, url: string) {
  return prisma.bookingDocument.upsert({
    where: { bookingId_type: { bookingId, type } },
    update: { url, uploadedDate: new Date() },
    create: { bookingId, type, url },
  });
}

export async function replaceComponents(bookingId: string, components: ComponentUpsert[]) {
  return prisma.$transaction(async (tx) => {
    await tx.bookingComponent.deleteMany({ where: { bookingId } });
    if (components.length > 0) {
      await tx.bookingComponent.createMany({
        data: components.map((c, i) => ({
          bookingId,
          component: c.component,
          detail: c.detail ?? "",
          status: c.status,
          sortOrder: c.sortOrder ?? i,
        })),
      });
    }
    return tx.booking.findUniqueOrThrow({ where: { id: bookingId }, include: BOOKING_INCLUDE });
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

  return tx.booking.create({
    data: {
      leadId: lead.id,
      quotationId: latestQuotation?.id ?? null,
      destinationId: lead.destinationId,
      travelDate: lead.travelDate,
    },
  });
}
