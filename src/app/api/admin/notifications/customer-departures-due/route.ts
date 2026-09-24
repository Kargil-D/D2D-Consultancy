import { NextResponse, type NextRequest } from "next/server";
import { listCustomerDeparturesDue } from "@/services/bookingService";
import { ApiError } from "@/lib/apiError";
import { requireModuleAccess } from "@/lib/permissions";

/** Anyone with Bookings view access: bookings departing within 3 days or already under way, shown
 * through the trip's own end date. Unlike Supplier Payments Due, departure dates aren't master-only
 * cost data — the same Bookings module already shows them on the booking header. */
export async function GET(req: NextRequest) {
  try {
    await requireModuleAccess(req, "Bookings", "canView");
    const data = await listCustomerDeparturesDue();
    return NextResponse.json({ success: true, message: "OK", data });
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ success: false, message: err.message, data: null }, { status: err.statusCode });
    console.error("[/api/admin/notifications/customer-departures-due] GET", err);
    return NextResponse.json({ success: false, message: "Internal error", data: null }, { status: 500 });
  }
}
