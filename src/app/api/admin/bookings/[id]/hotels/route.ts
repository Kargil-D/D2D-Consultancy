import { NextResponse } from "next/server";
import { replaceHotels } from "@/services/bookingService";
import { BookingHotelSchema } from "@/lib/validation/booking";
import { z } from "zod";

const BodySchema = z.object({ rows: z.array(BookingHotelSchema) });

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const { rows } = BodySchema.parse(await req.json());
    const updated = await replaceHotels(id, rows);
    return NextResponse.json({ success: true, message: "Hotels saved", data: updated });
  } catch (err) {
    console.error("[/api/admin/bookings/[id]/hotels] PUT", err);
    const msg = err instanceof Error ? err.message : "Invalid payload";
    return NextResponse.json({ success: false, message: msg, data: null }, { status: 400 });
  }
}
