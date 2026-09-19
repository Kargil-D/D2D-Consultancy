import { NextResponse, type NextRequest } from "next/server";
import { listUsersByRole } from "@/services/userService";
import { ApiError } from "@/lib/apiError";
import { requireAnyModuleAccess } from "@/lib/permissions";

/** Staff-picker data (assignee dropdowns) — gated to roles that can view a module which assigns records to staff, so customers and unauthenticated callers can't enumerate staff emails. */
export async function GET(req: NextRequest) {
  try {
    await requireAnyModuleAccess(req, ["Leads", "Quotations", "Bookings", "BookingsMaster"], "canView");

    const url = new URL(req.url);
    const role = url.searchParams.get("role") ?? "Sales";
    const users = await listUsersByRole(role);
    return NextResponse.json({ success: true, message: "OK", data: users });
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ success: false, message: err.message, data: null }, { status: err.statusCode });
    console.error("[/api/admin/users] GET", err);
    return NextResponse.json({ success: false, message: "Internal error", data: null }, { status: 500 });
  }
}
