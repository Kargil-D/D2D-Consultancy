import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/apiError";
import { getBooking } from "@/services/bookingService";
import { buildHotelVoucherData, type BookingWithRelations } from "@/lib/bookingDocumentBuilders";
import { Prisma } from "@/generated/prisma/client";
import type { HotelTravelVoucherPdfData } from "@/lib/bookingVoucherPdf";

/** What the admin UI needs to render the voucher control — never the snapshot itself. */
export interface HotelVoucherMeta {
  hotelVoucherIssuedAt: Date | null;
  /** True when hotel/guest/reference data has changed since the voucher was issued. */
  hotelVoucherStale: boolean;
}

// Hashes the content only (not "generatedOn"), so re-building the same data always matches.
const contentHash = (data: HotelTravelVoucherPdfData) =>
  crypto.createHash("sha256").update(JSON.stringify(data.entries)).digest("hex");

/** The issued snapshot when there is one, otherwise a live build — so a voucher, once issued,
 * always renders exactly as issued until it is removed and generated again. */
export function resolveHotelVoucherData(booking: BookingWithRelations): HotelTravelVoucherPdfData | null {
  return (booking.hotelVoucher as unknown as HotelTravelVoucherPdfData | null) ?? buildHotelVoucherData(booking);
}

export function getHotelVoucherMeta(booking: BookingWithRelations): HotelVoucherMeta {
  if (!booking.hotelVoucherIssuedAt) return { hotelVoucherIssuedAt: null, hotelVoucherStale: false };
  const current = buildHotelVoucherData(booking);
  return {
    hotelVoucherIssuedAt: booking.hotelVoucherIssuedAt,
    hotelVoucherStale: !current || contentHash(current) !== booking.hotelVoucherHash,
  };
}

export async function issueHotelVoucher(id: string): Promise<HotelVoucherMeta> {
  const booking = await getBooking(id);
  if (!booking) throw new ApiError(404, "Booking not found");

  const data = buildHotelVoucherData(booking);
  if (!data) throw new ApiError(400, "Add at least one hotel and save before generating the voucher");

  const issuedAt = new Date();
  // Conditional on "not issued yet" so two simultaneous clicks can't both succeed.
  const res = await prisma.booking.updateMany({
    where: { id, hotelVoucherIssuedAt: null },
    data: {
      hotelVoucher: data as unknown as Prisma.InputJsonValue,
      hotelVoucherHash: contentHash(data),
      hotelVoucherIssuedAt: issuedAt,
    },
  });
  if (res.count === 0) throw new ApiError(409, "A hotel voucher is already issued. Remove it first to generate a new one.");

  return { hotelVoucherIssuedAt: issuedAt, hotelVoucherStale: false };
}

export async function clearHotelVoucher(id: string): Promise<HotelVoucherMeta> {
  await prisma.booking.update({
    where: { id },
    data: { hotelVoucher: Prisma.DbNull, hotelVoucherHash: null, hotelVoucherIssuedAt: null },
  });
  return { hotelVoucherIssuedAt: null, hotelVoucherStale: false };
}
