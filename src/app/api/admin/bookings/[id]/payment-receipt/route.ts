import { NextResponse, type NextRequest } from "next/server";
import { getBooking, bookingCode, requireBookingAccess } from "@/services/bookingService";
import { issuePaymentReceipt, clearPaymentReceipt, resolvePaymentReceiptData } from "@/services/paymentReceiptService";
import { renderTripReceiptPdf } from "@/lib/bookingVoucherPdf";
import { ApiError } from "@/lib/apiError";
import { requireModuleAccess, toViewer } from "@/lib/permissions";

export const runtime = "nodejs"; // @react-pdf/renderer needs the Node runtime

function failure(err: unknown, tag: string) {
  if (err instanceof ApiError) return NextResponse.json({ success: false, message: err.message, data: null }, { status: err.statusCode });
  console.error(tag, err);
  return NextResponse.json({ success: false, message: "Internal error", data: null }, { status: 500 });
}

/** View the issued receipt (the saved snapshot — never re-generated on view). */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireModuleAccess(req, "Bookings", "canView");
    const { id } = await ctx.params;
    await requireBookingAccess(id, toViewer(user));
    const booking = await getBooking(id);
    if (!booking) return NextResponse.json({ success: false, message: "Booking not found", data: null }, { status: 404 });
    if (!booking.paymentReceiptIssuedAt) {
      return NextResponse.json({ success: false, message: "No payment receipt has been generated yet", data: null }, { status: 404 });
    }

    const data = resolvePaymentReceiptData(booking);
    if (!data) return NextResponse.json({ success: false, message: "No payments recorded on this booking", data: null }, { status: 400 });

    const buffer = await renderTripReceiptPdf(data);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${bookingCode(booking.lead.seq)}-payment-receipt.pdf"`,
      },
    });
  } catch (err) {
    return failure(err, "[/api/admin/bookings/[id]/payment-receipt] GET");
  }
}

/** Generate and store the receipt. Rejected (409) while one is already issued. */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireModuleAccess(req, "Bookings", "canEdit");
    const { id } = await ctx.params;
    await requireBookingAccess(id, toViewer(user));
    const meta = await issuePaymentReceipt(id);
    return NextResponse.json({ success: true, message: "Payment receipt generated", data: meta });
  } catch (err) {
    return failure(err, "[/api/admin/bookings/[id]/payment-receipt] POST");
  }
}

/** Remove the issued receipt so a new one can be generated. */
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireModuleAccess(req, "Bookings", "canEdit");
    const { id } = await ctx.params;
    await requireBookingAccess(id, toViewer(user));
    const meta = await clearPaymentReceipt(id);
    return NextResponse.json({ success: true, message: "Payment receipt removed", data: meta });
  } catch (err) {
    return failure(err, "[/api/admin/bookings/[id]/payment-receipt] DELETE");
  }
}
