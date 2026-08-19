/** Today's date as YYYY-MM-DD in the local timezone — matches the value format of <input type="date">. */
export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Tomorrow's date as YYYY-MM-DD — the minimum selectable value for a "must be a future date" <input type="date">. */
export function tomorrowIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** True when dateStr is strictly after today (local time). Empty string is not a future date. */
export function isFutureDate(dateStr: string): boolean {
  return !!dateStr && dateStr > todayIso();
}

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
