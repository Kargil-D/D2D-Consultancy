import { NextResponse, type NextRequest } from "next/server";
import { getQuotation, buildPublicQuoteData, markPdfGenerated, requireQuotationAccess } from "@/services/quotationService";
import { renderQuotationPdf } from "@/lib/quotationPdf";
import { ApiError } from "@/lib/apiError";
import { requireModuleAccess, toViewer } from "@/lib/permissions";

export const runtime = "nodejs"; // @react-pdf/renderer needs the Node runtime

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireModuleAccess(req, "Quotations", "canView");
    const { id } = await ctx.params;
    await requireQuotationAccess(id, toViewer(user));
    const quotation = await getQuotation(id);
    if (!quotation) {
      return NextResponse.json({ success: false, message: "Quotation not found", data: null }, { status: 404 });
    }

    const pdfData = await buildPublicQuoteData(quotation);
    const buffer = await renderQuotationPdf(pdfData);
    const download = new URL(req.url).searchParams.get("download") === "1";
    await markPdfGenerated(id);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${pdfData.quoteCode}.pdf"`,
      },
    });
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ success: false, message: err.message, data: null }, { status: err.statusCode });
    console.error("[/api/admin/quotations/[id]/pdf] GET", err);
    return NextResponse.json({ success: false, message: "Internal error", data: null }, { status: 500 });
  }
}
