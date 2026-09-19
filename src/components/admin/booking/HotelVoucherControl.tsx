"use client";

import IssuedDocumentControl from "@/components/admin/booking/IssuedDocumentControl";
import { bookingsApi } from "@/lib/adminApi";

interface HotelVoucherMeta {
  hotelVoucherIssuedAt: string | null;
  hotelVoucherStale: boolean;
}

interface HotelVoucherControlProps {
  bookingId: string;
  issuedAt?: string | null;
  /** Hotel/guest/reference data changed after the voucher was issued. */
  stale?: boolean;
  /** The Hotels tab has edits that aren't saved yet — the voucher is built from saved data only. */
  hasUnsavedHotels?: boolean;
  onChange: (meta: HotelVoucherMeta) => void;
}

const toMeta = (data: HotelVoucherMeta) => ({ issuedAt: data.hotelVoucherIssuedAt, stale: data.hotelVoucherStale });

/** Hotel Voucher: generate → view → ✕ to remove and regenerate (see IssuedDocumentControl). */
export default function HotelVoucherControl({ bookingId, issuedAt, stale = false, hasUnsavedHotels = false, onChange }: HotelVoucherControlProps) {
  const wrap = (call: () => ReturnType<typeof bookingsApi.issueHotelVoucher>) => async () => {
    const res = await call();
    return { ...res, data: res.data ? toMeta(res.data) : null };
  };

  return (
    <IssuedDocumentControl
      documentLabel="Hotel Voucher"
      noun="voucher"
      generateLabel="Generate Hotel Voucher"
      viewHref={`/api/admin/bookings/${bookingId}/hotels/voucher`}
      issuedAt={issuedAt}
      stale={stale}
      blockedReason={hasUnsavedHotels ? "Save Hotels first — the voucher is built from saved details" : null}
      issue={wrap(() => bookingsApi.issueHotelVoucher(bookingId))}
      clear={wrap(() => bookingsApi.clearHotelVoucher(bookingId))}
      onChange={(meta) => onChange({ hotelVoucherIssuedAt: meta.issuedAt, hotelVoucherStale: meta.stale })}
    />
  );
}
