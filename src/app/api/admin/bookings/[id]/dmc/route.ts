import { NextResponse } from "next/server";
import { updateDmcInfo } from "@/services/bookingService";
import { DmcUpdateSchema } from "@/lib/validation/booking";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const payload = await req.json();
    const parsed = DmcUpdateSchema.parse(payload);
    const updated = await updateDmcInfo(id, parsed);
    return NextResponse.json({ success: true, message: "DMC details saved", data: updated });
  } catch (err) {
    console.error("[/api/admin/bookings/[id]/dmc] POST", err);
    const msg = err instanceof Error ? err.message : "Invalid payload";
    return NextResponse.json({ success: false, message: msg, data: null }, { status: 400 });
  }
}
