import { NextResponse } from "next/server";
import { getQuotation, toPublicQuoteData, markQuotationSent } from "@/services/quotationService";
import { renderQuotationPdf } from "@/lib/quotationPdf";
import { sendQuotationEmail } from "@/services/emailService";

export const runtime = "nodejs";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const quotation = await getQuotation(id);
    if (!quotation) {
      return NextResponse.json({ success: false, message: "Quotation not found", data: null }, { status: 404 });
    }
    if (!quotation.lead.email) {
      return NextResponse.json(
        { success: false, message: "This lead has no email address on file", data: null },
        { status: 400 },
      );
    }

    const pdfData = toPublicQuoteData(quotation);
    const pdfBuffer = await renderQuotationPdf(pdfData);
    const shareUrl = quotation.shareToken
      ? `${new URL(req.url).protocol}//${new URL(req.url).host}/quote/${quotation.shareToken}`
      : undefined;

    await sendQuotationEmail(quotation.lead.email, {
      quoteCode: pdfData.quoteCode,
      customerName: pdfData.customerName,
      destinationName: pdfData.destinationName,
      sellingPrice: pdfData.sellingPrice,
      shareUrl,
      pdfBuffer,
    });

    const updated = await markQuotationSent(id);
    return NextResponse.json({ success: true, message: "Email sent", data: updated });
  } catch (err) {
    console.error("[/api/admin/quotations/[id]/send-email] POST", err);
    const msg = err instanceof Error ? err.message : "Unable to send email";
    return NextResponse.json({ success: false, message: msg, data: null }, { status: 500 });
  }
}
