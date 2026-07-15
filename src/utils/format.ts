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
