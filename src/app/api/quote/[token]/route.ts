import { NextResponse } from "next/server";
import { getQuotationByShareToken, toPublicQuoteData } from "@/services/quotationService";

export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await ctx.params;
    const quotation = await getQuotationByShareToken(token);
    if (!quotation) {
      return NextResponse.json({ success: false, message: "Quote not found", data: null }, { status: 404 });
    }
    // Public route — only ever return the customer-safe shape (never cost/margin fields).
    return NextResponse.json({ success: true, message: "OK", data: toPublicQuoteData(quotation) });
  } catch (err) {
    console.error("[/api/quote/[token]] GET", err);
    return NextResponse.json({ success: false, message: "Internal error", data: null }, { status: 500 });
  }
}
