/** Pure pricing maths shared by the booking screen (client) and the payment validation (server),
 * so both always agree on the figure a customer's payments are capped at. Mirrors the quotation
 * Pricing step: cost → + margin → + GST = deal price. */
export interface QuotationPricingInput {
  items: { qty: number; cost: number }[];
  marginPercent: number;
  gstPercent: number;
}

export interface QuotationPricing {
  cost: number;
  marginValue: number;
  gstValue: number;
  /** cost + margin + GST — the quotation's grand total, and the ceiling for the customer payments on a booking. */
  dealPrice: number;
}

export function computeQuotationPricing(q: QuotationPricingInput): QuotationPricing {
  const cost = q.items.reduce((sum, i) => sum + i.qty * i.cost, 0);
  const marginValue = Math.round(cost * (q.marginPercent / 100));
  const subtotal = cost + marginValue;
  const gstValue = Math.round(subtotal * (q.gstPercent / 100));
  const dealPrice = subtotal + gstValue;
  return { cost, marginValue, gstValue, dealPrice };
}

/** The total price customer payments are capped at: the linked quotation's deal price, else the
 * booking's own Total Amount. null when neither is set yet (nothing to cap against). */
export function bookingTotalPrice(booking: { totalAmount: number; quotation?: QuotationPricingInput | null }): number | null {
  const fromQuotation = booking.quotation ? computeQuotationPricing(booking.quotation).dealPrice : 0;
  if (fromQuotation > 0) return fromQuotation;
  return booking.totalAmount > 0 ? booking.totalAmount : null;
}
