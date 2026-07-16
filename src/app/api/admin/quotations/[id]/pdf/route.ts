import { NextResponse } from "next/server";
import { getQuotation, toPublicQuoteData } from "@/services/quotationService";
import { renderQuotationPdf } from "@/lib/quotationPdf";

export const runtime = "nodejs"; // @react-pdf/renderer needs the Node runtime

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const quotation = await getQuotation(id);
    if (!quotation) {
      return NextResponse.json({ success: false, message: "Quotation not found", data: null }, { status: 404 });
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
    console.error("[/api/admin/quotations/[id]/pdf] GET", err);
    return NextResponse.json({ success: false, message: "Internal error", data: null }, { status: 500 });
  }
}
