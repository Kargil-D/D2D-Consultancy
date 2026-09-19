import { NextResponse, type NextRequest } from "next/server";
import { getTransfer, updateTransfer, removeTransfer } from "@/services/campaignTransferService";
import { TransferUpdateSchema } from "@/lib/validation/transfer";
import { ApiError } from "@/lib/apiError";
import { CAMPAIGN_PLAN_READ_MODULES, requireAnyModuleAccess, requireModuleAccess } from "@/lib/permissions";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireAnyModuleAccess(req, CAMPAIGN_PLAN_READ_MODULES, "canView");

    const { id } = await ctx.params;
    const rec = await getTransfer(id);
    return NextResponse.json({ success: true, message: "OK", data: rec });
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ success: false, message: err.message, data: null }, { status: err.statusCode });
    console.error("[/api/admin/transfers/[id]] GET", err);
    return NextResponse.json({ success: false, message: "Internal error", data: null }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireModuleAccess(req, "Campaigns", "canEdit");

    const { id } = await ctx.params;
    const payload = await req.json();
    const parsed = TransferUpdateSchema.parse(payload);
    const updated = await updateTransfer(id, parsed);
    return NextResponse.json({ success: true, message: "Updated", data: updated });
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ success: false, message: err.message, data: null }, { status: err.statusCode });
    console.error("[/api/admin/transfers/[id]] PUT", err);
    const msg = err instanceof Error ? err.message : "Invalid payload";
    return NextResponse.json({ success: false, message: msg, data: null }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireModuleAccess(req, "Campaigns", "canDelete");

    const { id } = await ctx.params;
    await removeTransfer(id);
    return NextResponse.json({ success: true, message: "Deleted", data: true });
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ success: false, message: err.message, data: null }, { status: err.statusCode });
    console.error("[/api/admin/transfers/[id]] DELETE", err);
    return NextResponse.json({ success: false, message: "Internal error", data: null }, { status: 500 });
  }
}
