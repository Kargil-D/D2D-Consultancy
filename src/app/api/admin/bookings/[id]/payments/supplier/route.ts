import { NextResponse } from "next/server";
import { addSupplierPayment } from "@/services/bookingService";
import { SupplierPaymentSchema } from "@/lib/validation/booking";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const parsed = SupplierPaymentSchema.parse(await req.json());
    const payment = await addSupplierPayment(id, parsed);
    return NextResponse.json({ success: true, message: "Payment recorded", data: payment });
  } catch (err) {
    console.error("[/api/admin/bookings/[id]/payments/supplier] POST", err);
    const msg = err instanceof Error ? err.message : "Invalid payload";
    return NextResponse.json({ success: false, message: msg, data: null }, { status: 400 });
  }
}
