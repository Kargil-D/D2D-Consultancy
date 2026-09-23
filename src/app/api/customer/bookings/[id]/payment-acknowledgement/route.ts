import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ApiError } from "@/lib/apiError";
import { getCustomerOwnedBooking, bookingCode } from "@/services/bookingService";
import { bookingTotalPrice } from "@/lib/quotationPricing";
import { renderPaymentAcknowledgementPdf, type PaymentAcknowledgementPdfData } from "@/lib/bookingVoucherPdf";

export const runtime = "nodejs"; // @react-pdf/renderer needs the Node runtime

const STATUS_LABELS: Record<string, string> = {
  Won: "Won",
  Booked: "Booked",
  OnTrip: "On Trip",
  Completed: "Completed",
  Cancelled: "Cancelled",
};

const MODE_LABELS: Record<string, string> = {
  Cash: "Cash",
  BankTransfer: "Bank Transfer",
  Card: "Card",
  UPI: "UPI",
  Cheque: "Cheque",
  Other: "Other",
};

/**
 * @swagger
 * /api/customer/bookings/{id}/payment-acknowledgement:
 *   get:
 *     summary: View or download a PDF acknowledgement for the total payment(s) received on the current customer's own booking
 *     tags: [Customer]
 *     parameters:
 *       - in: query
 *         name: download
 *         schema: { type: string }
 *         description: Pass "1" to force a download (attachment) instead of opening inline.
 *     responses:
 *       200:
 *         description: PDF acknowledgement
 *       400:
 *         description: No payments received yet
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

    const payments = [...booking.customerPayments].sort((a, b) => a.paymentDate.getTime() - b.paymentDate.getTime());
    if (payments.length === 0) {
      return NextResponse.json({ success: false, message: "No payments received on this booking yet", data: null }, { status: 400 });
    }

    const code = bookingCode(booking.lead.seq);
    const totalReceived = payments.reduce((sum, p) => sum + p.amount, 0);
    // Same figure the admin booking header ("Deal Price") and the Customer Payments cap use —
    // never the raw totalAmount column, which can sit stale after the quotation's pricing changes.
    const totalCost = bookingTotalPrice(booking) ?? 0;
    const balanceDue = Math.max(0, totalCost - totalReceived);

    const data: PaymentAcknowledgementPdfData = {
      ackNumber: `ACK-${code}`,
      issuedOn: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
      customerName: booking.lead.customerName,
      customerPhone: booking.lead.mobile,
      customerEmail: booking.lead.email,
      destinationName: booking.destination.name,
      bookingId: code,
      bookingStatusLabel: STATUS_LABELS[booking.status] ?? booking.status,
      totalReceived,
      totalCost,
      balanceDue,
      payments: payments.map((p, i) => ({
        label: `Payment ${i + 1}`,
        dateLabel: p.paymentDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
        modeLabel: MODE_LABELS[p.paymentMode] ?? p.paymentMode,
        reference: p.transactionReference,
        amount: p.amount,
      })),
    };

    const buffer = await renderPaymentAcknowledgementPdf(data);
    const download = new URL(req.url).searchParams.get("download") === "1";

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="Payment-Acknowledgement-${code}.pdf"`,
      },
    });
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ success: false, message: err.message, data: null }, { status: err.statusCode });
    console.error("[/api/customer/bookings/[id]/payment-acknowledgement] GET", err);
    return NextResponse.json({ success: false, message: "Internal error", data: null }, { status: 500 });
  }
}
