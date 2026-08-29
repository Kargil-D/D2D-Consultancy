import { NextResponse, type NextRequest } from "next/server";
import { getBooking, bookingCode, requireBookingAccess } from "@/services/bookingService";
import { renderServiceVoucherPdf } from "@/lib/bookingVoucherPdf";
import { ApiError } from "@/lib/apiError";
import { requireModuleAccess, toViewer } from "@/lib/permissions";

export const runtime = "nodejs";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string; transferId: string }> }) {
  try {
    const user = await requireModuleAccess(req, "Bookings", "canView");
    const { id, transferId } = await ctx.params;
    await requireBookingAccess(id, toViewer(user));
    const booking = await getBooking(id);
    if (!booking) {
      return NextResponse.json({ success: false, message: "Booking not found", data: null }, { status: 404 });
    }
    const transfer = booking.transfers.find((t) => t.id === transferId);
    if (!transfer) {
      return NextResponse.json({ success: false, message: "Transfer not found", data: null }, { status: 404 });
    }

    const buffer = await renderServiceVoucherPdf({
      bookingCode: bookingCode(booking.seq),
      customerName: booking.lead.customerName,
      mobile: booking.lead.mobile,
      serviceLabel: "Transfer",
      title: transfer.transferType || "Transfer",
      fields: [
        { label: "Vehicle Type", value: transfer.vehicleType },
        { label: "Private / SIC", value: transfer.mode },
        { label: "Pickup Date & Time", value: transfer.pickupAt ? transfer.pickupAt.toLocaleString("en-IN") : "" },
        { label: "Pickup Location", value: transfer.pickupLocation },
        { label: "Drop Location", value: transfer.dropLocation },
        { label: "Driver Name", value: transfer.driverName },
        { label: "Driver Mobile", value: transfer.driverMobile },
        { label: "Vehicle Number", value: transfer.vehicleNumber },
        { label: "Supplier", value: transfer.supplier },
      ],
    });

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${bookingCode(booking.seq)}-transfer-voucher.pdf"`,
      },
    });
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ success: false, message: err.message, data: null }, { status: err.statusCode });
    console.error("[/api/admin/bookings/[id]/transfers/[transferId]/voucher] GET", err);
    return NextResponse.json({ success: false, message: "Internal error", data: null }, { status: 500 });
  }
}
