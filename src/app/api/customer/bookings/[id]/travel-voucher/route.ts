import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ApiError } from "@/lib/apiError";
import { getCustomerOwnedBooking, bookingCode } from "@/services/bookingService";
import { renderTripReceiptPdf } from "@/lib/bookingVoucherPdf";
import { buildTripReceiptData } from "@/lib/bookingDocumentBuilders";

export const runtime = "nodejs"; // @react-pdf/renderer needs the Node runtime

/**
 * @swagger
 * /api/customer/bookings/{id}/travel-voucher:
 *   get:
 *     summary: View or download the full trip voucher (itinerary + payment summary) for the current customer's own booking
 *     tags: [Customer]
 *     parameters:
 *       - in: query
 *         name: download
 *         schema: { type: string }
 *         description: Pass "1" to force a download (attachment) instead of opening inline.
 *     responses:
 *       200:
 *         description: PDF travel voucher
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: No matching booking
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(req);
    const { id } = await ctx.params;

    const booking = await getCustomerOwnedBooking(id, user.email);
    if (!booking) throw new ApiError(404, "Booking not found");

    const code = bookingCode(booking.lead.seq);
    const buffer = await renderTripReceiptPdf(buildTripReceiptData(booking));
    const download = new URL(req.url).searchParams.get("download") === "1";

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="Travel-Voucher-${code}.pdf"`,
      },
    });
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ success: false, message: err.message, data: null }, { status: err.statusCode });
    console.error("[/api/customer/bookings/[id]/travel-voucher] GET", err);
    return NextResponse.json({ success: false, message: "Internal error", data: null }, { status: 500 });
  }
}
