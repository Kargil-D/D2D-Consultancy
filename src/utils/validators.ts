/** Basic sanity check — one "@", something on both sides, a "." in the domain part. Not RFC 5322-complete, but catches typos like "d2dholid.com" (no "@" at all). */
export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/** Strips everything but digits and checks the count falls in the ITU E.164 range (7-15) — accepts "+91 98765 43210", "98765-43210", etc. without requiring a specific country format. */
export function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}
