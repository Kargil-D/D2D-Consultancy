import { NextResponse } from "next/server";
import { getBooking, bookingCode } from "@/services/bookingService";
import { renderServiceVoucherPdf } from "@/lib/bookingVoucherPdf";

export const runtime = "nodejs";

export async function GET(req: Request, ctx: { params: Promise<{ id: string; transferId: string }> }) {
  try {
    const { id, transferId } = await ctx.params;
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
    console.error("[/api/admin/bookings/[id]/transfers/[transferId]/voucher] GET", err);
    return NextResponse.json({ success: false, message: "Internal error", data: null }, { status: 500 });
  }
}
