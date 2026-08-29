import { NextResponse, type NextRequest } from "next/server";
import { duplicateQuotation, requireQuotationAccess } from "@/services/quotationService";
import { ApiError } from "@/lib/apiError";
import { requireModuleAccess, toViewer } from "@/lib/permissions";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireModuleAccess(req, "Quotations", "canAdd");
    const { id } = await ctx.params;
    await requireQuotationAccess(id, toViewer(user));
    const copy = await duplicateQuotation(id);
    return NextResponse.json({ success: true, message: "Duplicated", data: copy });
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ success: false, message: err.message, data: null }, { status: err.statusCode });
    console.error("[/api/admin/quotations/[id]/duplicate] POST", err);
    return NextResponse.json({ success: false, message: "Internal error", data: null }, { status: 500 });
  }
}
