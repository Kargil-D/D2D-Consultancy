/**
 * Prefixes for the human-readable ID codes shown in the Quotations/Bookings/Leads admin tables
 * (e.g. "QT-0013"), each formatted elsewhere as `` `${prefix}${seq.toString().padStart(4, "0")}` ``
 * from that model's `seq` auto-increment column. Defined here so search — which needs to parse
 * these same codes back into a `seq` number — stays in sync with the format.
 */
export const QUOTE_PREFIX = "QT-";
export const BOOKING_PREFIX = "BK-";
export const LEAD_PREFIX = "LD-";

/**
 * Reverses the "QT-0013"/"BK-0013"/"LD-0013" formatters: given `prefix`, returns the seq number
 * if `text` (any case, extra whitespace) starts with it and the rest is a positive integer, else
 * null — so callers can just skip adding the condition rather than matching seq 0/NaN.
 */
export function parseSeqCode(text: string, prefix: string): number | null {
  const trimmed = text.trim();
  if (!trimmed.toUpperCase().startsWith(prefix)) return null;
  const rest = trimmed.slice(prefix.length).trim();
  if (!/^\d+$/.test(rest)) return null;
  const n = Number(rest);
  return n > 0 ? n : null;
}
