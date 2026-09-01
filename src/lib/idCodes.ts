/**
 * Shared 6-digit tracking code shown across Leads/Quotations/Bookings, always derived from the
 * Lead's own `seq` auto-increment column — a Lead and every Quotation raised for it and every
 * Booking made from those quotations all display the identical number, so staff can trace one
 * customer's journey end-to-end with a single code. Quotation/Booking keep their own `seq`
 * columns in the database (unrelated internal ordering), but no longer format their own `seq`
 * into anything user-facing — every display point formats the row's *lead's* `seq` instead.
 */
export const trackingCode = (seq: number) => seq.toString().padStart(6, "0");

/**
 * Reverses trackingCode: an all-digit search string -> the seq number to match against a
 * Lead directly (`{ seq }`) or via a relation (`{ lead: { seq } }`). Returns null for
 * non-numeric or non-positive input so callers can skip adding the condition.
 */
export function parseTrackingCode(text: string): number | null {
  const trimmed = text.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const n = Number(trimmed);
  return n > 0 ? n : null;
}
