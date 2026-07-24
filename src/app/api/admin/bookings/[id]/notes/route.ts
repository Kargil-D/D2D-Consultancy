import { NextResponse } from "next/server";
import { addBookingNote } from "@/services/bookingService";
import { BookingNoteSchema } from "@/lib/validation/booking";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const { authorName, message } = BookingNoteSchema.parse(await req.json());
    const note = await addBookingNote(id, authorName, message);
    return NextResponse.json({ success: true, message: "Note added", data: note });
  } catch (err) {
    console.error("[/api/admin/bookings/[id]/notes] POST", err);
    const msg = err instanceof Error ? err.message : "Invalid payload";
    return NextResponse.json({ success: false, message: msg, data: null }, { status: 400 });
  }
}
