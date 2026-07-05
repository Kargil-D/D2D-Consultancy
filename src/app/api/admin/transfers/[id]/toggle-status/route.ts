import { NextResponse } from "next/server";
import { toggleTransferStatus } from "@/services/campaignTransferService";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const updated = await toggleTransferStatus(id);
    return NextResponse.json({ success: true, message: "Status updated", data: updated });
  } catch (err) {
    console.error("[/api/admin/transfers/[id]/toggle-status] POST", err);
    return NextResponse.json({ success: false, message: "Internal error", data: null }, { status: 500 });
  }
}
