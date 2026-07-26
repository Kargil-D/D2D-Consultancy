import { NextResponse } from "next/server";
import { saveCostSheet } from "@/services/bookingService";
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

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const { rows } = BodySchema.parse(await req.json());
    const updated = await saveCostSheet(id, rows);
    return NextResponse.json({ success: true, message: "Cost sheet saved", data: updated });
  } catch (err) {
    console.error("[/api/admin/bookings/[id]/cost-sheet] PUT", err);
    const msg = err instanceof Error ? err.message : "Invalid payload";
    return NextResponse.json({ success: false, message: msg, data: null }, { status: 400 });
  }
}
