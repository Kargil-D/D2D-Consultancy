import { NextResponse, type NextRequest } from "next/server";
import { getOrBuildEmailDraft, saveEmailDraft } from "@/services/bookingEmailService";
import { BookingEmailDraftSchema } from "@/lib/validation/bookingEmail";
import { ApiError } from "@/lib/apiError";
import { requireModuleAccess } from "@/lib/permissions";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireModuleAccess(req, "Bookings", "canView");
    const { id } = await ctx.params;
    const url = new URL(req.url);
    const type = url.searchParams.get("type") === "Supplier" ? "Supplier" : "Customer";

    const draft = await getOrBuildEmailDraft(id, type);
    if (!draft) {
      return NextResponse.json({ success: false, message: "Booking not found", data: null }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: "OK", data: draft });
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ success: false, message: err.message, data: null }, { status: err.statusCode });
    console.error("[/api/admin/bookings/[id]/email-draft] GET", err);
    return NextResponse.json({ success: false, message: "Internal error", data: null }, { status: 500 });
  }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireModuleAccess(req, "Bookings", "canEdit");
    const { id } = await ctx.params;
    const payload = await req.json();
    const parsed = BookingEmailDraftSchema.parse(payload);
    const { recipientType, ...rest } = parsed;
    const draft = await saveEmailDraft(id, recipientType, rest);
    return NextResponse.json({ success: true, message: "Draft saved", data: draft });
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ success: false, message: err.message, data: null }, { status: err.statusCode });
    console.error("[/api/admin/bookings/[id]/email-draft] POST", err);
    const msg = err instanceof Error ? err.message : "Invalid payload";
    return NextResponse.json({ success: false, message: msg, data: null }, { status: 400 });
  }
}
