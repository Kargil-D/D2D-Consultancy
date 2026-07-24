import { NextResponse } from "next/server";
import { removeCustomerDocument } from "@/services/bookingService";

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string; docId: string }> }) {
  try {
    const { docId } = await ctx.params;
    await removeCustomerDocument(docId);
    return NextResponse.json({ success: true, message: "Document removed", data: true });
  } catch (err) {
    console.error("[/api/admin/bookings/[id]/documents/[docId]] DELETE", err);
    return NextResponse.json({ success: false, message: "Internal error", data: null }, { status: 500 });
  }
}
