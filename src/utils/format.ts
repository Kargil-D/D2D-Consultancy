// Currency formatting helper.
// Uses currencyDisplay: "code" (renders "INR 70,000") instead of the default
// "₹" symbol — the site's self-hosted fonts (next/font/google, latin subset
// only) don't include the ₹ glyph (U+20B9), which was rendering as "?".
export const formatINR = (value: number): string =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    currencyDisplay: "code",
    maximumFractionDigits: 0,
  }).format(value);

/** Same "no ₹ glyph" constraint as formatINR, but abbreviated (Lakh/Crore) for compact
 * headline figures — e.g. a dashboard KPI tile — where the full amount would be too wide. */
export const formatINRCompact = (value: number): string =>
  `INR ${new Intl.NumberFormat("en-IN", { notation: "compact", compactDisplay: "short", maximumFractionDigits: 1 }).format(value)}`;
