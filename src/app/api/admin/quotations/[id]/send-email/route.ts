import { NextResponse, type NextRequest } from "next/server";
import { getQuotation, buildPublicQuoteData, markQuotationSent, requireQuotationAccess } from "@/services/quotationService";
import { renderQuotationPdf } from "@/lib/quotationPdf";
import { sendQuotationEmail } from "@/services/emailService";
import { ApiError } from "@/lib/apiError";
import { requireModuleAccess, toViewer } from "@/lib/permissions";

export const runtime = "nodejs";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireModuleAccess(req, "Quotations", "canEdit");
    const { id } = await ctx.params;
    await requireQuotationAccess(id, toViewer(user));
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

    const pdfData = await buildPublicQuoteData(quotation);
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
    if (err instanceof ApiError) return NextResponse.json({ success: false, message: err.message, data: null }, { status: err.statusCode });
    console.error("[/api/admin/quotations/[id]/send-email] POST", err);
    const msg = err instanceof Error ? err.message : "Unable to send email";
    return NextResponse.json({ success: false, message: msg, data: null }, { status: 500 });
  }
}
