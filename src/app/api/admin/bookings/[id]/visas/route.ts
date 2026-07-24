import { NextResponse } from "next/server";
import { replaceVisas } from "@/services/bookingService";
import { BookingVisaSchema } from "@/lib/validation/booking";
import { z } from "zod";

const BodySchema = z.object({ rows: z.array(BookingVisaSchema) });

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const { rows } = BodySchema.parse(await req.json());
    const updated = await replaceVisas(id, rows);
    return NextResponse.json({ success: true, message: "Visas saved", data: updated });
  } catch (err) {
    console.error("[/api/admin/bookings/[id]/visas] PUT", err);
    const msg = err instanceof Error ? err.message : "Invalid payload";
    return NextResponse.json({ success: false, message: msg, data: null }, { status: 400 });
  }
}
