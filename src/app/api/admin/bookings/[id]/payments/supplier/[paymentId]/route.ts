import { NextResponse, type NextRequest } from "next/server";
import { removeSupplierPayment, requireBookingAccess } from "@/services/bookingService";
import { ApiError } from "@/lib/apiError";
import { requireModuleAccess, toViewer } from "@/lib/permissions";

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string; paymentId: string }> }) {
  try {
    const user = await requireModuleAccess(req, "BookingsMaster", "canDelete");
    const { id, paymentId } = await ctx.params;
    await requireBookingAccess(id, toViewer(user));
    await removeSupplierPayment(id, paymentId);
    return NextResponse.json({ success: true, message: "Payment removed", data: true });
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ success: false, message: err.message, data: null }, { status: err.statusCode });
    console.error("[/api/admin/bookings/[id]/payments/supplier/[paymentId]] DELETE", err);
    return NextResponse.json({ success: false, message: "Internal error", data: null }, { status: 500 });
  }
}
