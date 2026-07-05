import { NextResponse } from "next/server";
import { toggleHotelStatus } from "@/services/campaignHotelService";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const updated = await toggleHotelStatus(id);
    return NextResponse.json({ success: true, message: "Status updated", data: updated });
  } catch (err) {
    console.error("[/api/admin/hotels/[id]/toggle-status] POST", err);
    return NextResponse.json({ success: false, message: "Internal error", data: null }, { status: 500 });
  }
}
