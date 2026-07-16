import { NextResponse } from "next/server";
import { getQuotationByShareToken, toPublicQuoteData } from "@/services/quotationService";
import { renderQuotationPdf } from "@/lib/quotationPdf";

export const runtime = "nodejs";

export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await ctx.params;
    const quotation = await getQuotationByShareToken(token);
    if (!quotation) {
      return NextResponse.json({ success: false, message: "Quote not found", data: null }, { status: 404 });
    }

    const pdfData = toPublicQuoteData(quotation);
    const buffer = await renderQuotationPdf(pdfData);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${pdfData.quoteCode}.pdf"`,
      },
    });
  } catch (err) {
    console.error("[/api/quote/[token]/pdf] GET", err);
    return NextResponse.json({ success: false, message: "Internal error", data: null }, { status: 500 });
  }
}
