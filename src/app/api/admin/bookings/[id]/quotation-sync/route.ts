import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getQuotationChangeStatusById, resolveQuotationChange, requireBookingAccess } from "@/services/bookingService";
import { ApiError } from "@/lib/apiError";
import { requireModuleAccess, toViewer } from "@/lib/permissions";

const ResolveSchema = z.object({ action: z.enum(["refresh", "keep"]) });

function failure(err: unknown, tag: string) {
  if (err instanceof ApiError) return NextResponse.json({ success: false, message: err.message, data: null }, { status: err.statusCode });
  if (err instanceof z.ZodError) return NextResponse.json({ success: false, message: "Invalid payload", data: null }, { status: 400 });
  console.error(tag, err);
  return NextResponse.json({ success: false, message: "Internal error", data: null }, { status: 500 });
}

/** Has the linked quotation been edited since this booking last synced to it? */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireModuleAccess(req, "Bookings", "canView");
    const { id } = await ctx.params;
    await requireBookingAccess(id, toViewer(user));
    return NextResponse.json({ success: true, message: "OK", data: await getQuotationChangeStatusById(id) });
  } catch (err) {
    return failure(err, "[/api/admin/bookings/[id]/quotation-sync] GET");
  }
}

/** Answer the prompt: refresh the booking from the quotation, or keep it as-is. */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireModuleAccess(req, "Bookings", "canEdit");
    const { id } = await ctx.params;
    await requireBookingAccess(id, toViewer(user));
    const { action } = ResolveSchema.parse(await req.json());
    const data = await resolveQuotationChange(id, action);
    return NextResponse.json({ success: true, message: action === "refresh" ? "Booking refreshed from quotation" : "Booking kept as-is", data });
  } catch (err) {
    return failure(err, "[/api/admin/bookings/[id]/quotation-sync] POST");
  }
}
