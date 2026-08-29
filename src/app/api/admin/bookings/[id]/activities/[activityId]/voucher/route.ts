import { NextResponse, type NextRequest } from "next/server";
import { getBooking, bookingCode, requireBookingAccess } from "@/services/bookingService";
import { renderServiceVoucherPdf } from "@/lib/bookingVoucherPdf";
import { ApiError } from "@/lib/apiError";
import { requireModuleAccess, toViewer } from "@/lib/permissions";

export const runtime = "nodejs";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string; activityId: string }> }) {
  try {
    const user = await requireModuleAccess(req, "Bookings", "canView");
    const { id, activityId } = await ctx.params;
    await requireBookingAccess(id, toViewer(user));
    const booking = await getBooking(id);
    if (!booking) {
      return NextResponse.json({ success: false, message: "Booking not found", data: null }, { status: 404 });
    }
    const activity = booking.activities.find((a) => a.id === activityId);
    if (!activity) {
      return NextResponse.json({ success: false, message: "Activity not found", data: null }, { status: 404 });
    }

    const buffer = await renderServiceVoucherPdf({
      bookingCode: bookingCode(booking.seq),
      customerName: booking.lead.customerName,
      mobile: booking.lead.mobile,
      serviceLabel: "Activity",
      title: activity.activityName || "Activity",
      fields: [
        { label: "Activity Date", value: activity.activityDate ? activity.activityDate.toLocaleDateString("en-IN") : "" },
        { label: "Activity Time", value: activity.activityTime },
        { label: "Duration", value: activity.duration },
        { label: "Tour Type", value: activity.tourType },
        { label: "Pickup Included", value: activity.pickupIncluded ? "Yes" : "No" },
        { label: "Pickup Time", value: activity.pickupTime },
        { label: "No. of Pax", value: String(activity.pax) },
        { label: "Supplier", value: activity.supplier },
      ],
    });

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${bookingCode(booking.seq)}-activity-voucher.pdf"`,
      },
    });
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ success: false, message: err.message, data: null }, { status: err.statusCode });
    console.error("[/api/admin/bookings/[id]/activities/[activityId]/voucher] GET", err);
    return NextResponse.json({ success: false, message: "Internal error", data: null }, { status: 500 });
  }
}
