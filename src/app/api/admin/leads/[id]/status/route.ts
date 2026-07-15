import { NextResponse } from "next/server";
import { updateLeadStatus } from "@/services/leadService";
import { LeadStatusUpdateSchema } from "@/lib/validation/lead";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const payload = await req.json();
    const { status } = LeadStatusUpdateSchema.parse(payload);
    const updated = await updateLeadStatus(id, status);
    return NextResponse.json({ success: true, message: "Status updated", data: updated });
  } catch (err) {
    console.error("[/api/admin/leads/[id]/status] POST", err);
    const msg = err instanceof Error ? err.message : "Invalid payload";
    return NextResponse.json({ success: false, message: msg, data: null }, { status: 400 });
  }
}
