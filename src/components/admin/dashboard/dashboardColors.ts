/**
 * Categorical + status colors for the admin dashboard's charts, taken verbatim from the
 * data-viz skill's validated reference palette (references/palette.md) — order is the CVD-safety
 * mechanism, not cosmetic, so slots are used in this fixed sequence, never reassigned per chart.
 * Light-mode only: the rest of the admin panel has no dark-mode variant to match.
 */
export const CATEGORICAL = [
  "#2a78d6", // 1 blue
  "#eb6834", // 2 orange
  "#1baf7a", // 3 aqua
  "#eda100", // 4 yellow
  "#e87ba4", // 5 magenta
  "#008300", // 6 green
  "#4a3aa7", // 7 violet
  "#e34948", // 8 red
] as const;

export const STATUS = {
  good: "#0ca30c",
  warning: "#fab219",
  serious: "#ec835a",
  critical: "#d03b3b",
} as const;

export const CHART_INK = {
  primary: "#0b0b0b",
  secondary: "#52514e",
  muted: "#898781",
  gridline: "#e1e0d9",
  baseline: "#c3c2b7",
};

/** Fixed per-series colors for the three KPI trend lines — same three entities everywhere in
 * this dashboard, so their colors stay consistent chart-to-chart. */
export const SERIES_COLOR = {
  leads: CATEGORICAL[0],
  quotations: CATEGORICAL[1],
  bookings: CATEGORICAL[2],
};

/** Booking lifecycle: terminal states get real status colors (success/failure read at a
 * glance); in-progress states get categorical hues for plain distinctness. */
export const BOOKING_STATUS_COLOR: Record<string, string> = {
  Won: CATEGORICAL[0],
  Booked: CATEGORICAL[2],
  OnTrip: STATUS.warning,
  Completed: STATUS.good,
  Cancelled: STATUS.critical,
};

export const LEAD_SOURCE_COLOR: Record<string, string> = {
  Website: CATEGORICAL[0],
  WhatsApp: CATEGORICAL[1],
  Referral: CATEGORICAL[2],
  MetaAds: CATEGORICAL[3],
  GoogleAds: CATEGORICAL[4],
  SEO: CATEGORICAL[5],
  Manual: CATEGORICAL[6],
};
