import { NextResponse, type NextRequest } from "next/server";
import { getBooking, bookingCode, requireBookingAccess } from "@/services/bookingService";
import { renderVoucherPdf } from "@/lib/bookingVoucherPdf";
import { ApiError } from "@/lib/apiError";
import { requireModuleAccess, toViewer } from "@/lib/permissions";

export const runtime = "nodejs";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireModuleAccess(req, "Bookings", "canView");
    const { id } = await ctx.params;
    await requireBookingAccess(id, toViewer(user));
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
      flights: booking.flights.map((f) => ({ airline: f.airline, flightNumber: f.flightNumber, fromLocation: f.fromLocation, toLocation: f.toLocation, pnr: f.pnr })),
      hotels: booking.hotels.map((h) => ({
        hotelName: h.hotelName,
        roomType: h.roomType,
        checkIn: h.checkIn ? h.checkIn.toLocaleDateString("en-IN") : null,
        checkOut: h.checkOut ? h.checkOut.toLocaleDateString("en-IN") : null,
        nights: h.nights,
      })),
      activities: booking.activities.map((a) => ({
        activityName: a.activityName,
        activityDate: a.activityDate ? a.activityDate.toLocaleDateString("en-IN") : null,
        duration: a.duration,
      })),
      transfers: booking.transfers.map((t) => ({ transferType: t.transferType, vehicleType: t.vehicleType, pickupLocation: t.pickupLocation, dropLocation: t.dropLocation })),
      visas: booking.visas.map((v) => ({ country: v.country, visaType: v.visaType, status: v.status })),
      insurances: booking.insurances.map((i) => ({ insuranceCompany: i.insuranceCompany, policyNumber: i.policyNumber, planName: i.planName })),
    });

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${bookingCode(booking.seq)}-voucher.pdf"`,
      },
    });
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ success: false, message: err.message, data: null }, { status: err.statusCode });
    console.error("[/api/admin/bookings/[id]/voucher] GET", err);
    return NextResponse.json({ success: false, message: "Internal error", data: null }, { status: 500 });
  }
}
