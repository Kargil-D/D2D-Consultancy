import { NextResponse } from "next/server";
import { upsertDocument } from "@/services/bookingService";
import { DocumentUploadSchema } from "@/lib/validation/booking";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const payload = await req.json();
    const { type, url } = DocumentUploadSchema.parse(payload);
    const doc = await upsertDocument(id, type, url);
    return NextResponse.json({ success: true, message: "Document saved", data: doc });
  } catch (err) {
    console.error("[/api/admin/bookings/[id]/documents] POST", err);
    const msg = err instanceof Error ? err.message : "Invalid payload";
    return NextResponse.json({ success: false, message: msg, data: null }, { status: 400 });
  }
}
