import { NextResponse, type NextRequest } from "next/server";
import { sendBookingEmail } from "@/services/bookingEmailService";
import { BookingSendEmailSchema } from "@/lib/validation/bookingEmail";
import { ApiError } from "@/lib/apiError";
import { requireModuleAccess } from "@/lib/permissions";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireModuleAccess(req, "Bookings", "canEdit");
    const { id } = await ctx.params;
    const payload = await req.json();
    const parsed = BookingSendEmailSchema.parse(payload);
    await sendBookingEmail(id, parsed);
    return NextResponse.json({ success: true, message: "Email sent", data: null });
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ success: false, message: err.message, data: null }, { status: err.statusCode });
    console.error("[/api/admin/bookings/[id]/send-mail] POST", err);
    const msg = err instanceof Error ? err.message : "Unable to send email";
    return NextResponse.json({ success: false, message: msg, data: null }, { status: 500 });
  }
}
