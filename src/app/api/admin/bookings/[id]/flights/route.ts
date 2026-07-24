import { NextResponse } from "next/server";
import { replaceFlights } from "@/services/bookingService";
import { BookingFlightSchema } from "@/lib/validation/booking";
import { z } from "zod";

const BodySchema = z.object({ rows: z.array(BookingFlightSchema) });

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const { rows } = BodySchema.parse(await req.json());
    const updated = await replaceFlights(id, rows);
    return NextResponse.json({ success: true, message: "Flights saved", data: updated });
  } catch (err) {
    console.error("[/api/admin/bookings/[id]/flights] PUT", err);
    const msg = err instanceof Error ? err.message : "Invalid payload";
    return NextResponse.json({ success: false, message: msg, data: null }, { status: 400 });
  }
}
