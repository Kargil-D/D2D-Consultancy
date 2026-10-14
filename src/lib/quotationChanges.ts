import type { QuotationSyncSnapshot } from "@/lib/quotationSyncHash";
import type { QuotationChange } from "@/types/admin";

/** A change line plus whether it exposes margin/cost data (BookingsMaster-only). */
export interface QuotationChangeLine extends QuotationChange {
  sensitive?: boolean;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Quotation dates are calendar dates stored at UTC midnight, so they're read back in UTC. */
function fmtDate(v: unknown): string {
  if (!v) return "—";
  const d = new Date(String(v));
  if (Number.isNaN(d.getTime())) return String(v);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

const fmtText = (v: unknown) => (v === null || v === undefined || v === "" ? "—" : String(v));
const fmtMoney = (v: unknown) => `INR ${Number(v ?? 0).toLocaleString("en-IN")}`;

type Formatter = (v: unknown) => string;
type FieldSpec = [key: string, label: string, format?: Formatter];

type Row = Record<string, unknown> & { id?: unknown };

/** "Label: old → new" for each listed field whose formatted value differs. */
function fieldDiffs(before: Row, after: Row, fields: FieldSpec[]): string[] {
  const out: string[] = [];
  for (const [key, label, format = fmtText] of fields) {
    const a = format(before[key]);
    const b = format(after[key]);
    if (a !== b) out.push(`${label}: ${a} → ${b}`);
  }
  return out;
}

const asRows = (v: unknown): Row[] => (Array.isArray(v) ? (v.filter((r) => r && typeof r === "object") as Row[]) : []);

/** Rows matched by id → added / removed / changed lines for one section. */
function diffRows(
  section: QuotationChange["section"],
  before: Row[],
  after: Row[],
  label: (r: Row) => string,
  summary: (r: Row) => string,
  fields: FieldSpec[],
): QuotationChangeLine[] {
  const lines: QuotationChangeLine[] = [];
  const beforeById = new Map(before.map((r) => [String(r.id), r]));
  const afterIds = new Set(after.map((r) => String(r.id)));

  for (const r of after) {
    const prev = beforeById.get(String(r.id));
    if (!prev) {
      const extra = summary(r);
      lines.push({ section, text: `Added ${label(r)}${extra ? ` (${extra})` : ""}` });
      continue;
    }
    const diffs = fieldDiffs(prev, r, fields);
    if (diffs.length) lines.push({ section, text: `${label(r)} — ${diffs.join("; ")}` });
  }
  for (const r of before) {
    if (!afterIds.has(String(r.id))) lines.push({ section, text: `Removed ${label(r)}` });
  }
  return lines;
}

/** Hotels live inside option groups (Option A/B/C); flattened, with the option label kept for display. */
function flattenHotels(hotelOptions: unknown): Row[] {
  const groups = asRows(hotelOptions);
  const multiple = groups.length > 1;
  return groups.flatMap((g) =>
    asRows(g.hotels).map((h) => ({ ...h, _option: multiple ? String(g.label ?? "") : "" })),
  );
}

/** Costing lines have no stable id of their own: matched by their source row id, or for manual lines
 * (Visa/Insurance/Flight) by component + detail + occurrence, so duplicates still pair up in order. */
function keyedItems(items: QuotationSyncSnapshot["items"]): Row[] {
  const seen = new Map<string, number>();
  return (items ?? []).map((i) => {
    const base = i.sourceId ?? `${i.component}|${i.detail}`;
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    return { ...i, id: `${base}#${n}` };
  });
}

/**
 * Human-readable list of what changed between the quotation a booking last synced to and the quotation
 * now. Margin % and costing lines are marked `sensitive` — callers must drop them for viewers without
 * BookingsMaster (see redactQuotationChanges).
 */
export function diffQuotationSnapshots(before: QuotationSyncSnapshot, after: QuotationSyncSnapshot): QuotationChangeLine[] {
  const lines: QuotationChangeLine[] = [];

  const trip = fieldDiffs(before as unknown as Row, after as unknown as Row, [
    ["departureDate", "Departure date", fmtDate],
    ["travelDate", "Travel date", fmtDate],
    ["adults", "Adults"],
    ["children", "Children"],
    ["infants", "Infants"],
    ["gstPercent", "GST %"],
  ]);
  lines.push(...trip.map((text) => ({ section: "Trip" as const, text })));

  const hotelLabel = (h: Row) => `${fmtText(h.hotelName)}${h._option ? ` (${h._option})` : ""}`;
  lines.push(
    ...diffRows("Hotels", flattenHotels(before.hotelOptions), flattenHotels(after.hotelOptions), hotelLabel,
      (h) => `${fmtDate(h.checkIn)} – ${fmtDate(h.checkOut)}, ${fmtText(h.nights)} night(s)`,
      [
        ["hotelName", "Hotel"],
        ["category", "Category"],
        ["checkIn", "Check-in", fmtDate],
        ["checkOut", "Check-out", fmtDate],
        ["nights", "Nights"],
        ["rooms", "Rooms"],
        ["roomType", "Room type"],
        ["mealPlan", "Meal plan"],
      ]),
  );

  lines.push(
    ...diffRows("Activities", asRows(before.activities), asRows(after.activities), (a) => fmtText(a.name),
      (a) => (a.activityDate ? fmtDate(a.activityDate) : ""),
      [
        ["name", "Activity"],
        ["activityDate", "Date", fmtDate],
        ["activityTime", "Time"],
        ["reportingTime", "Reporting time"],
        ["duration", "Duration"],
        ["pax", "Pax"],
      ]),
  );

  const transferLabel = (t: Row) => (t.name ? String(t.name) : `${fmtText(t.pickupLocation)} → ${fmtText(t.dropLocation)}`);
  lines.push(
    ...diffRows("Transfers", asRows(before.transfers), asRows(after.transfers), transferLabel,
      (t) => [fmtText(t.vehicleType), t.transferDate ? fmtDate(t.transferDate) : ""].filter((s) => s && s !== "—").join(", "),
      [
        ["name", "Transfer"],
        ["transferDate", "Date", fmtDate],
        ["pickupTime", "Pickup time"],
        ["pickupLocation", "Pickup"],
        ["dropLocation", "Drop"],
        ["vehicleType", "Vehicle"],
        ["mode", "Mode"],
      ]),
  );

  const margin = fieldDiffs(before as unknown as Row, after as unknown as Row, [["marginPercent", "Margin %"]]);
  lines.push(...margin.map((text) => ({ section: "Pricing" as const, text, sensitive: true })));

  const itemLabel = (i: Row) => fmtText(i.detail || i.component);
  lines.push(
    ...diffRows("Pricing", keyedItems(before.items), keyedItems(after.items), itemLabel,
      (i) => `${fmtText(i.qty)} × ${fmtMoney(i.cost)}`,
      [
        ["qty", "Qty"],
        ["cost", "Cost", fmtMoney],
      ]).map((l) => ({ ...l, sensitive: true })),
  );

  return lines;
}

/** Drops margin/cost lines for viewers without BookingsMaster, replacing them with one neutral line so
 * they still know pricing moved (the deal price shown on the booking may change on refresh). */
export function redactQuotationChanges(lines: QuotationChangeLine[] | null, canViewMaster: boolean): QuotationChange[] | null {
  if (!lines) return null;
  const visible = lines.filter((l) => canViewMaster || !l.sensitive).map(({ section, text }) => ({ section, text }));
  if (!canViewMaster && visible.length < lines.length) visible.push({ section: "Pricing", text: "Pricing / costing was updated" });
  return visible;
}
