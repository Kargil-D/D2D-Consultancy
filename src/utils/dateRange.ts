/** "2026-08-12" -> "12/08/26" — the DD/MM/YY format used in the "pick a date between X and Y" message. */
export function formatShortDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-");
  if (!y || !m || !d) return isoDate;
  return `${d}/${m}/${y.slice(-2)}`;
}

/** True when dateStr falls within [minDate, maxDate] (inclusive) — missing bounds are treated as unbounded on that side. */
export function isWithinRange(dateStr: string, minDate?: string, maxDate?: string): boolean {
  if (!dateStr) return true;
  if (minDate && dateStr < minDate) return false;
  if (maxDate && dateStr > maxDate) return false;
  return true;
}

export function dateRangeMessage(minDate?: string, maxDate?: string): string {
  if (minDate && maxDate) return `Please select a date between ${formatShortDate(minDate)} and ${formatShortDate(maxDate)}.`;
  if (minDate) return `Please select a date on or after ${formatShortDate(minDate)}.`;
  if (maxDate) return `Please select a date on or before ${formatShortDate(maxDate)}.`;
  return "Please select the travel dates first.";
}
