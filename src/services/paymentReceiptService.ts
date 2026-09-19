import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/apiError";
import { getBooking } from "@/services/bookingService";
import { buildPaymentReceiptData, type BookingWithRelations } from "@/lib/bookingDocumentBuilders";
import { Prisma } from "@/generated/prisma/client";
import type { TripReceiptPdfData } from "@/lib/bookingVoucherPdf";

/** What the admin UI needs to render the receipt control — never the snapshot itself. */
export interface PaymentReceiptMeta {
  paymentReceiptIssuedAt: Date | null;
  /** True when payments/trip details have changed since the receipt was issued. */
  paymentReceiptStale: boolean;
}

// Hashes everything except "issuedOn" (today's date), so re-building the same data always matches.
const contentHash = (data: TripReceiptPdfData) =>
  crypto.createHash("sha256").update(JSON.stringify({ ...data, issuedOn: "" })).digest("hex");

/** The issued snapshot when there is one, otherwise a live build — so a receipt, once issued,
 * always renders exactly as issued until it is removed and generated again. */
export function resolvePaymentReceiptData(booking: BookingWithRelations): TripReceiptPdfData | null {
  return (booking.paymentReceipt as unknown as TripReceiptPdfData | null) ?? buildPaymentReceiptData(booking);
}

export function getPaymentReceiptMeta(booking: BookingWithRelations): PaymentReceiptMeta {
  if (!booking.paymentReceiptIssuedAt) return { paymentReceiptIssuedAt: null, paymentReceiptStale: false };
  const current = buildPaymentReceiptData(booking);
  return {
    paymentReceiptIssuedAt: booking.paymentReceiptIssuedAt,
    paymentReceiptStale: !current || contentHash(current) !== booking.paymentReceiptHash,
  };
}

export async function issuePaymentReceipt(id: string): Promise<PaymentReceiptMeta> {
  const booking = await getBooking(id);
  if (!booking) throw new ApiError(404, "Booking not found");

  const data = buildPaymentReceiptData(booking);
  if (!data) throw new ApiError(400, "Record at least one customer payment before generating the receipt");

  const issuedAt = new Date();
  // Conditional on "not issued yet" so two simultaneous clicks can't both succeed.
  const res = await prisma.booking.updateMany({
    where: { id, paymentReceiptIssuedAt: null },
    data: {
      paymentReceipt: data as unknown as Prisma.InputJsonValue,
      paymentReceiptHash: contentHash(data),
      paymentReceiptIssuedAt: issuedAt,
    },
  });
  if (res.count === 0) throw new ApiError(409, "A payment receipt is already issued. Remove it first to generate a new one.");

  return { paymentReceiptIssuedAt: issuedAt, paymentReceiptStale: false };
}

export async function clearPaymentReceipt(id: string): Promise<PaymentReceiptMeta> {
  await prisma.booking.update({
    where: { id },
    data: { paymentReceipt: Prisma.DbNull, paymentReceiptHash: null, paymentReceiptIssuedAt: null },
  });
  return { paymentReceiptIssuedAt: null, paymentReceiptStale: false };
}
