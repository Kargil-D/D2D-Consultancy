import { NextResponse } from "next/server";
import { updateBookingStatus } from "@/services/bookingService";
import { BookingStatusUpdateSchema } from "@/lib/validation/booking";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const payload = await req.json();
    const { status } = BookingStatusUpdateSchema.parse(payload);
    const updated = await updateBookingStatus(id, status);
    return NextResponse.json({ success: true, message: "Status updated", data: updated });
  } catch (err) {
    console.error("[/api/admin/bookings/[id]/status] POST", err);
    const msg = err instanceof Error ? err.message : "Invalid payload";
    return NextResponse.json({ success: false, message: msg, data: null }, { status: 400 });
  }
}
