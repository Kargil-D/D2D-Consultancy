import { NextResponse, type NextRequest } from "next/server";
import { updateLeadStatus } from "@/services/leadService";
import { LeadStatusUpdateSchema } from "@/lib/validation/lead";
import { ApiError } from "@/lib/apiError";
import { requireModuleAccess } from "@/lib/permissions";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireModuleAccess(req, "Leads", "canEdit");
    const { id } = await ctx.params;
    const payload = await req.json();
    const { status } = LeadStatusUpdateSchema.parse(payload);
    const updated = await updateLeadStatus(id, status);
    return NextResponse.json({ success: true, message: "Status updated", data: updated });
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ success: false, message: err.message, data: null }, { status: err.statusCode });
    console.error("[/api/admin/leads/[id]/status] POST", err);
    const msg = err instanceof Error ? err.message : "Invalid payload";
    return NextResponse.json({ success: false, message: msg, data: null }, { status: 400 });
  }
}
