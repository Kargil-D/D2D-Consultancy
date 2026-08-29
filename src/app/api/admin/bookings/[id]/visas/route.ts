import { NextResponse, type NextRequest } from "next/server";
import { replaceVisas, requireBookingAccess } from "@/services/bookingService";
import { BookingVisaSchema } from "@/lib/validation/booking";
import { ApiError } from "@/lib/apiError";
import { requireModuleAccess, toViewer } from "@/lib/permissions";
import { z } from "zod";

const BodySchema = z.object({ rows: z.array(BookingVisaSchema) });

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireModuleAccess(req, "Bookings", "canEdit");
    const { id } = await ctx.params;
    await requireBookingAccess(id, toViewer(user));
    const { rows } = BodySchema.parse(await req.json());
    const updated = await replaceVisas(id, rows);
    return NextResponse.json({ success: true, message: "Visas saved", data: updated });
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ success: false, message: err.message, data: null }, { status: err.statusCode });
    console.error("[/api/admin/bookings/[id]/visas] PUT", err);
    const msg = err instanceof Error ? err.message : "Invalid payload";
    return NextResponse.json({ success: false, message: msg, data: null }, { status: 400 });
  }
}
