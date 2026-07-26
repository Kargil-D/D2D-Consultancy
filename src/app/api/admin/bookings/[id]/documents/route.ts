import { NextResponse } from "next/server";
import { addCustomerDocument } from "@/services/bookingService";
import { DocumentUploadSchema } from "@/lib/validation/booking";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const { type, url, description } = DocumentUploadSchema.parse(await req.json());
    const doc = await addCustomerDocument(id, type, url, description);
    return NextResponse.json({ success: true, message: "Document uploaded", data: doc });
  } catch (err) {
    console.error("[/api/admin/bookings/[id]/documents] POST", err);
    const msg = err instanceof Error ? err.message : "Invalid payload";
    return NextResponse.json({ success: false, message: msg, data: null }, { status: 400 });
  }
}
