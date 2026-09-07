import { NextResponse, type NextRequest } from "next/server";
import { saveCostSheet, requireBookingAccess } from "@/services/bookingService";
import { ApiError } from "@/lib/apiError";
import { requireModuleAccess, toViewer } from "@/lib/permissions";
import { z } from "zod";

const RowSchema = z.object({
  id: z.string(),
  supplierName: z.string().optional(),
  bookingCost: z.coerce.number().min(0).optional(),
  settlementCost: z.coerce.number().min(0).optional(),
  sellingPrice: z.coerce.number().min(0).optional(),
  status: z.enum(["Pending", "Confirmed", "Invoiced", "Settled"]).optional(),
  remarks: z.string().optional().nullable(),
});
const BodySchema = z.object({ rows: z.array(RowSchema) });

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireModuleAccess(req, "BookingsMaster", "canEdit");
    const { id } = await ctx.params;
    await requireBookingAccess(id, toViewer(user));
    const { rows } = BodySchema.parse(await req.json());
    const updated = await saveCostSheet(id, rows);
    return NextResponse.json({ success: true, message: "Cost sheet saved", data: updated });
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ success: false, message: err.message, data: null }, { status: err.statusCode });
    console.error("[/api/admin/bookings/[id]/cost-sheet] PUT", err);
    const msg = err instanceof Error ? err.message : "Invalid payload";
    return NextResponse.json({ success: false, message: msg, data: null }, { status: 400 });
  }
}
