import { NextResponse, type NextRequest } from "next/server";
import { listBookings, createBooking } from "@/services/bookingService";
import { BookingCreateSchema } from "@/lib/validation/booking";
import { ApiError } from "@/lib/apiError";
import { requireModuleAccess, toViewer } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  try {
    const user = await requireModuleAccess(req, "Bookings", "canView");
    const viewer = toViewer(user);
    const url = new URL(req.url);
    const search = url.searchParams.get("search") ?? undefined;
    const page = Number(url.searchParams.get("page") ?? "1");
    const pageSize = Number(url.searchParams.get("pageSize") ?? "10");
    const leadId = url.searchParams.get("leadId") ?? undefined;
    const status = url.searchParams.get("status") ?? undefined;
    const bookingExecutiveId = url.searchParams.get("bookingExecutiveId") ?? undefined;

    const filter: Record<string, unknown> = {};
    if (leadId) filter.leadId = leadId;
    if (status) filter.status = status;
    // Non-admins are already scoped to their own records by listBookings — only Admin's explicit choice of executive is honored here.
    if (viewer.isAdmin && bookingExecutiveId) filter.bookingExecutiveId = bookingExecutiveId;

    const data = await listBookings({ search, page, pageSize, filter }, viewer);
    return NextResponse.json({ success: true, message: "OK", data });
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ success: false, message: err.message, data: null }, { status: err.statusCode });
    console.error("[/api/admin/bookings] GET", err);
    return NextResponse.json({ success: false, message: "Internal error", data: null }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireModuleAccess(req, "Bookings", "canAdd");
    const viewer = toViewer(user);
    const payload = await req.json();
    const parsed = BookingCreateSchema.parse(payload);
    if (!viewer.isAdmin) {
      if (parsed.bookingExecutiveId !== undefined && parsed.bookingExecutiveId !== viewer.id) delete parsed.bookingExecutiveId;
      if (parsed.customerSupportId !== undefined && parsed.customerSupportId !== viewer.id) delete parsed.customerSupportId;
    }
    const created = await createBooking(parsed);
    return NextResponse.json({ success: true, message: "Created", data: created });
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ success: false, message: err.message, data: null }, { status: err.statusCode });
    console.error("[/api/admin/bookings] POST", err);
    const msg = err instanceof Error ? err.message : "Invalid payload";
    return NextResponse.json({ success: false, message: msg, data: null }, { status: 400 });
  }
}
