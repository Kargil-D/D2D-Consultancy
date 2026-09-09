import { NextResponse, type NextRequest } from "next/server";
import { getBooking, bookingCode, requireBookingAccess } from "@/services/bookingService";
import { renderHotelTravelVoucherPdf, type HotelTravelVoucherEntry } from "@/lib/bookingVoucherPdf";
import { ApiError } from "@/lib/apiError";
import { requireModuleAccess, toViewer } from "@/lib/permissions";

export const runtime = "nodejs";

const ORDINALS = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"];
function ordinal(n: number) {
  return ORDINALS[n - 1] ?? `${n}th`;
}

function formatFullDate(date: Date | null) {
  if (!date) return null;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireModuleAccess(req, "Bookings", "canView");
    const { id } = await ctx.params;
    await requireBookingAccess(id, toViewer(user));
    const booking = await getBooking(id);
    if (!booking) {
      return NextResponse.json({ success: false, message: "Booking not found", data: null }, { status: 404 });
    }

    if (booking.hotels.length === 0) {
      return NextResponse.json({ success: false, message: "No hotel stays on this booking yet", data: null }, { status: 400 });
    }

    const tripCode = bookingCode(booking.lead.seq);
    const occupancy = [
      `${booking.adults} ${booking.adults === 1 ? "Adult" : "Adults"}`,
      booking.children > 0 ? `${booking.children} ${booking.children === 1 ? "Child" : "Children"}` : null,
    ].filter(Boolean).join(", ");
    const paxCount = booking.adults + booking.children;

    const entries: HotelTravelVoucherEntry[] = booking.hotels.map((h) => {
      const roomLabel = [h.roomCategory, h.roomType].filter(Boolean).join(" ") || "Room";
      const rows = Array.from({ length: Math.max(h.nights, 1) }, (_, i) => ({
        night: ordinal(i + 1),
        mealPlan: h.mealPlan,
        room: `${h.rooms} ${roomLabel} (${paxCount} Pax)`,
      }));

      return {
        hotelName: h.hotelName,
        hotelAddress: h.hotelAddress,
        guestName: booking.lead.customerName,
        occupancy,
        d2dBookingId: `D2D-${tripCode}`,
        bookingCnf: h.bookingPnr || "—",
        tripId: tripCode,
        checkInDate: formatFullDate(h.checkIn),
        checkOutDate: formatFullDate(h.checkOut),
        nights: h.nights,
        rows,
      };
    });

    const generatedOn = new Date().toLocaleString("en-GB", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC",
    }).replace(",", "") + " Hrs UTC";

    const buffer = await renderHotelTravelVoucherPdf({ entries, generatedOn });

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${tripCode}-hotel-voucher.pdf"`,
      },
    });
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ success: false, message: err.message, data: null }, { status: err.statusCode });
    console.error("[/api/admin/bookings/[id]/hotels/voucher] GET", err);
    return NextResponse.json({ success: false, message: "Internal error", data: null }, { status: 500 });
  }
}
