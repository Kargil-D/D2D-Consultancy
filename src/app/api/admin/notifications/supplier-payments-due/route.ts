import { NextResponse, type NextRequest } from "next/server";
import { listSupplierPaymentsDue } from "@/services/bookingService";
import { ApiError } from "@/lib/apiError";
import { requireAdmin } from "@/lib/permissions";

/** Admin-only: bookings whose Supplier Payment Due Date is within 3 days or overdue, and not yet
 * fully paid off. Surfaced in the account-menu notification list. */
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const data = await listSupplierPaymentsDue();
    return NextResponse.json({ success: true, message: "OK", data });
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ success: false, message: err.message, data: null }, { status: err.statusCode });
    console.error("[/api/admin/notifications/supplier-payments-due] GET", err);
    return NextResponse.json({ success: false, message: "Internal error", data: null }, { status: 500 });
  }
}
