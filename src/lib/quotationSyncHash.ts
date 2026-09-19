import crypto from "crypto";

/** The slice of a Quotation a Booking is derived from — trip/traveller details, the hotel/transfer/activity
 * rows copied into the booking's service tabs, and the costing that feeds the Cost Sheet and payment cap. */
export interface QuotationSyncSource {
  departureDate: Date | null;
  travelDate: Date | null;
  adults: number;
  children: number;
  infants: number;
  marginPercent: number;
  gstPercent: number;
  hotelOptions: unknown;
  transfers: unknown;
  activities: unknown;
  items: { sourceId: string | null; component: string; detail: string; qty: number; cost: number; currencyCode: string }[];
}

/** Deliberately ignores status, share token, PDF timestamp, notes and the itinerary text: those change without
 * affecting anything the booking mirrors, and must not trigger the "quotation changed" prompt. */
export function quotationSyncHash(q: QuotationSyncSource): string {
  const content = {
    departureDate: q.departureDate,
    travelDate: q.travelDate,
    adults: q.adults,
    children: q.children,
    infants: q.infants,
    marginPercent: q.marginPercent,
    gstPercent: q.gstPercent,
    hotelOptions: q.hotelOptions,
    transfers: q.transfers,
    activities: q.activities,
    items: q.items.map((i) => ({ sourceId: i.sourceId, component: i.component, detail: i.detail, qty: i.qty, cost: i.cost, currencyCode: i.currencyCode })),
  };
  return crypto.createHash("sha256").update(JSON.stringify(content)).digest("hex");
}
