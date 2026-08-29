import { NextResponse, type NextRequest } from "next/server";
import { getLead, updateLead, removeLead, requireLeadAccess } from "@/services/leadService";
import { LeadUpdateSchema } from "@/lib/validation/lead";
import { ApiError } from "@/lib/apiError";
import { requireModuleAccess, toViewer } from "@/lib/permissions";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireModuleAccess(req, "Leads", "canView");
    const { id } = await ctx.params;
    await requireLeadAccess(id, toViewer(user));
    const rec = await getLead(id);
    return NextResponse.json({ success: true, message: "OK", data: rec });
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ success: false, message: err.message, data: null }, { status: err.statusCode });
    console.error("[/api/admin/leads/[id]] GET", err);
    return NextResponse.json({ success: false, message: "Internal error", data: null }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireModuleAccess(req, "Leads", "canEdit");
    const viewer = toViewer(user);
    const { id } = await ctx.params;
    await requireLeadAccess(id, viewer);
    const payload = await req.json();
    const parsed = LeadUpdateSchema.parse(payload);
    if (!viewer.isAdmin && parsed.assignedToId !== undefined && parsed.assignedToId !== viewer.id) {
      delete parsed.assignedToId;
    }
    const updated = await updateLead(id, parsed);
    return NextResponse.json({ success: true, message: "Updated", data: updated });
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ success: false, message: err.message, data: null }, { status: err.statusCode });
    console.error("[/api/admin/leads/[id]] PUT", err);
    const msg = err instanceof Error ? err.message : "Invalid payload";
    return NextResponse.json({ success: false, message: msg, data: null }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireModuleAccess(req, "Leads", "canDelete");
    const { id } = await ctx.params;
    await requireLeadAccess(id, toViewer(user));
    await removeLead(id);
    return NextResponse.json({ success: true, message: "Deleted", data: true });
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ success: false, message: err.message, data: null }, { status: err.statusCode });
    console.error("[/api/admin/leads/[id]] DELETE", err);
    return NextResponse.json({ success: false, message: "Internal error", data: null }, { status: 500 });
  }
}
