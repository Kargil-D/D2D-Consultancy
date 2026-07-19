import { NextResponse } from "next/server";
import { getBooking, updateBookingStatus, bookingCode } from "@/services/bookingService";
import { renderVoucherPdf } from "@/lib/bookingVoucherPdf";

export const runtime = "nodejs";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const booking = await getBooking(id);
    if (!booking) {
      return NextResponse.json({ success: false, message: "Booking not found", data: null }, { status: 404 });
    }

    const buffer = await renderVoucherPdf({
      bookingCode: bookingCode(booking.seq),
      customerName: booking.lead.customerName,
      mobile: booking.lead.mobile,
      destinationName: booking.destination.name,
      travelDate: booking.travelDate ? booking.travelDate.toLocaleDateString("en-IN") : null,
      totalAmount: booking.totalAmount,
      components: booking.components.map((c) => ({ component: c.component, detail: c.detail, status: c.status })),
    });

    // Generating the voucher advances the pipeline toward Booked, per the spec.
    if (booking.status !== "Booked") {
      await updateBookingStatus(id, "VoucherGenerated");
    }

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${bookingCode(booking.seq)}-voucher.pdf"`,
      },
    });
  } catch (err) {
    console.error("[/api/admin/bookings/[id]/voucher] GET", err);
    return NextResponse.json({ success: false, message: "Internal error", data: null }, { status: 500 });
  }
}
