import { NextResponse } from "next/server";
import { getQuotation, updateQuotation, removeQuotation } from "@/services/quotationService";
import { QuotationUpdateSchema } from "@/lib/validation/quotation";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const rec = await getQuotation(id);
    return NextResponse.json({ success: true, message: "OK", data: rec });
  } catch (err) {
    console.error("[/api/admin/quotations/[id]] GET", err);
    return NextResponse.json({ success: false, message: "Internal error", data: null }, { status: 500 });
  }
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const payload = await req.json();
    const parsed = QuotationUpdateSchema.parse(payload);
    const updated = await updateQuotation(id, parsed);
    return NextResponse.json({ success: true, message: "Updated", data: updated });
  } catch (err) {
    console.error("[/api/admin/quotations/[id]] PUT", err);
    const msg = err instanceof Error ? err.message : "Invalid payload";
    return NextResponse.json({ success: false, message: msg, data: null }, { status: 400 });
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    await removeQuotation(id);
    return NextResponse.json({ success: true, message: "Deleted", data: true });
  } catch (err) {
    console.error("[/api/admin/quotations/[id]] DELETE", err);
    return NextResponse.json({ success: false, message: "Internal error", data: null }, { status: 500 });
  }
}
