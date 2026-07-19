import { NextResponse } from "next/server";
import { replaceComponents } from "@/services/bookingService";
import { ComponentUpsertSchema } from "@/lib/validation/booking";
import { z } from "zod";

const BodySchema = z.object({ components: z.array(ComponentUpsertSchema) });

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const payload = await req.json();
    const { components } = BodySchema.parse(payload);
    const updated = await replaceComponents(id, components);
    return NextResponse.json({ success: true, message: "Components saved", data: updated });
  } catch (err) {
    console.error("[/api/admin/bookings/[id]/components] PUT", err);
    const msg = err instanceof Error ? err.message : "Invalid payload";
    return NextResponse.json({ success: false, message: msg, data: null }, { status: 400 });
  }
}
