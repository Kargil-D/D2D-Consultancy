import { NextResponse, type NextRequest } from "next/server";
import { addCustomerDocument, requireBookingAccess } from "@/services/bookingService";
import { DocumentUploadSchema } from "@/lib/validation/booking";
import { ApiError } from "@/lib/apiError";
import { requireModuleAccess, toViewer } from "@/lib/permissions";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireModuleAccess(req, "Bookings", "canEdit");
    const { id } = await ctx.params;
    await requireBookingAccess(id, toViewer(user));
    const { type, url, description } = DocumentUploadSchema.parse(await req.json());
    const doc = await addCustomerDocument(id, type, url, description);
    return NextResponse.json({ success: true, message: "Document uploaded", data: doc });
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ success: false, message: err.message, data: null }, { status: err.statusCode });
    console.error("[/api/admin/bookings/[id]/documents] POST", err);
    const msg = err instanceof Error ? err.message : "Invalid payload";
    return NextResponse.json({ success: false, message: msg, data: null }, { status: 400 });
  }
}
