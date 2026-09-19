import { NextResponse, type NextRequest } from "next/server";
import { generateShareLink, requireQuotationAccess } from "@/services/quotationService";
import { ApiError } from "@/lib/apiError";
import { requireModuleAccess, toViewer } from "@/lib/permissions";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireModuleAccess(req, "Quotations", "canEdit");
    const { id } = await ctx.params;
    await requireQuotationAccess(id, toViewer(user));
    const token = await generateShareLink(id);
    const url = new URL(req.url);
    const shareUrl = `${url.protocol}//${url.host}/quote/${token}`;
    return NextResponse.json({ success: true, message: "Link generated", data: { token, url: shareUrl } });
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ success: false, message: err.message, data: null }, { status: err.statusCode });
    console.error("[/api/admin/quotations/[id]/share] POST", err);
    return NextResponse.json({ success: false, message: "Internal error", data: null }, { status: 500 });
  }
}
