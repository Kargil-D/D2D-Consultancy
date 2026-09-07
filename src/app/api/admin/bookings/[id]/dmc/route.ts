import { NextResponse, type NextRequest } from "next/server";
import { updateDmcInfo, requireBookingAccess } from "@/services/bookingService";
import { DmcUpdateSchema } from "@/lib/validation/booking";
import { ApiError } from "@/lib/apiError";
import { requireModuleAccess, toViewer } from "@/lib/permissions";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireModuleAccess(req, "BookingsMaster", "canEdit");
    const { id } = await ctx.params;
    await requireBookingAccess(id, toViewer(user));
    const payload = await req.json();
    const parsed = DmcUpdateSchema.parse(payload);
    const updated = await updateDmcInfo(id, parsed);
    return NextResponse.json({ success: true, message: "DMC details saved", data: updated });
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ success: false, message: err.message, data: null }, { status: err.statusCode });
    console.error("[/api/admin/bookings/[id]/dmc] POST", err);
    const msg = err instanceof Error ? err.message : "Invalid payload";
    return NextResponse.json({ success: false, message: msg, data: null }, { status: 400 });
  }
}
