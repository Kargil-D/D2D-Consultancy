import { NextResponse, type NextRequest } from "next/server";
import { getQuotationForBuilder, updateQuotation, removeQuotation } from "@/services/quotationService";
import { QuotationUpdateSchema } from "@/lib/validation/quotation";
import { ApiError } from "@/lib/apiError";
import { requireModuleAccess } from "@/lib/permissions";
import { perfTime } from "@/lib/perf";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireModuleAccess(req, "Quotations", "canView");
    const { id } = await ctx.params;
    const rec = await perfTime(
      "GET /api/admin/quotations/[id]",
      () => getQuotationForBuilder(id),
      (r) => ({ found: !!r, bytes: JSON.stringify(r).length }),
    );
    return NextResponse.json({ success: true, message: "OK", data: rec });
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ success: false, message: err.message, data: null }, { status: err.statusCode });
    console.error("[/api/admin/quotations/[id]] GET", err);
    return NextResponse.json({ success: false, message: "Internal error", data: null }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireModuleAccess(req, "Quotations", "canEdit");
    const { id } = await ctx.params;
    const payload = await req.json();
    const parsed = QuotationUpdateSchema.parse(payload);
    const updated = await updateQuotation(id, parsed);
    return NextResponse.json({ success: true, message: "Updated", data: updated });
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ success: false, message: err.message, data: null }, { status: err.statusCode });
    console.error("[/api/admin/quotations/[id]] PUT", err);
    const msg = err instanceof Error ? err.message : "Invalid payload";
    return NextResponse.json({ success: false, message: msg, data: null }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireModuleAccess(req, "Quotations", "canDelete");
    const { id } = await ctx.params;
    await removeQuotation(id);
    return NextResponse.json({ success: true, message: "Deleted", data: true });
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ success: false, message: err.message, data: null }, { status: err.statusCode });
    console.error("[/api/admin/quotations/[id]] DELETE", err);
    return NextResponse.json({ success: false, message: "Internal error", data: null }, { status: 500 });
  }
}
