import { NextResponse, type NextRequest } from "next/server";
import { addSupplierPayment, requireBookingAccess } from "@/services/bookingService";
import { SupplierPaymentSchema } from "@/lib/validation/booking";
import { ApiError } from "@/lib/apiError";
import { requireModuleAccess, toViewer } from "@/lib/permissions";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireModuleAccess(req, "Bookings", "canEdit");
    const { id } = await ctx.params;
    await requireBookingAccess(id, toViewer(user));
    const parsed = SupplierPaymentSchema.parse(await req.json());
    const payment = await addSupplierPayment(id, parsed);
    return NextResponse.json({ success: true, message: "Payment recorded", data: payment });
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ success: false, message: err.message, data: null }, { status: err.statusCode });
    console.error("[/api/admin/bookings/[id]/payments/supplier] POST", err);
    const msg = err instanceof Error ? err.message : "Invalid payload";
    return NextResponse.json({ success: false, message: msg, data: null }, { status: 400 });
  }
}
