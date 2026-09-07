import { NextResponse, type NextRequest } from "next/server";
import { getBooking, updateBooking, removeBooking, requireBookingAccess, redactMasterFields } from "@/services/bookingService";
import { BookingUpdateSchema } from "@/lib/validation/booking";
import { ApiError } from "@/lib/apiError";
import { requireModuleAccess, hasModulePermission, toViewer } from "@/lib/permissions";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireModuleAccess(req, "Bookings", "canView");
    const { id } = await ctx.params;
    await requireBookingAccess(id, toViewer(user));
    const rec = await getBooking(id);
    const data = rec && !hasModulePermission(user, "BookingsMaster", "canView") ? redactMasterFields(rec) : rec;
    return NextResponse.json({ success: true, message: "OK", data });
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ success: false, message: err.message, data: null }, { status: err.statusCode });
    console.error("[/api/admin/bookings/[id]] GET", err);
    return NextResponse.json({ success: false, message: "Internal error", data: null }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireModuleAccess(req, "Bookings", "canEdit");
    const viewer = toViewer(user);
    const { id } = await ctx.params;
    await requireBookingAccess(id, viewer);
    const payload = await req.json();
    const parsed = BookingUpdateSchema.parse(payload);
    if (!viewer.isAdmin) {
      if (parsed.bookingExecutiveId !== undefined && parsed.bookingExecutiveId !== viewer.id) delete parsed.bookingExecutiveId;
      if (parsed.customerSupportId !== undefined && parsed.customerSupportId !== viewer.id) delete parsed.customerSupportId;
    }
    if (!hasModulePermission(user, "BookingsMaster", "canEdit")) {
      delete parsed.supplierTrackId;
      delete parsed.supplierInvoiceAmount;
      delete parsed.supplierInvoiceUrl;
    }
    const updated = await updateBooking(id, parsed);
    return NextResponse.json({ success: true, message: "Updated", data: updated });
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ success: false, message: err.message, data: null }, { status: err.statusCode });
    console.error("[/api/admin/bookings/[id]] PUT", err);
    const msg = err instanceof Error ? err.message : "Invalid payload";
    return NextResponse.json({ success: false, message: msg, data: null }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireModuleAccess(req, "Bookings", "canDelete");
    const { id } = await ctx.params;
    await requireBookingAccess(id, toViewer(user));
    await removeBooking(id);
    return NextResponse.json({ success: true, message: "Deleted", data: true });
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ success: false, message: err.message, data: null }, { status: err.statusCode });
    console.error("[/api/admin/bookings/[id]] DELETE", err);
    return NextResponse.json({ success: false, message: "Internal error", data: null }, { status: 500 });
  }
}
