import { NextResponse } from "next/server";
import { getBooking, bookingCode } from "@/services/bookingService";
import { renderInvoicePdf } from "@/lib/bookingInvoicePdf";

export const runtime = "nodejs";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const url = new URL(req.url);
    const kind = url.searchParams.get("kind") === "supplier" ? "supplier" : "customer";

    const booking = await getBooking(id);
    if (!booking) {
      return NextResponse.json({ success: false, message: "Booking not found", data: null }, { status: 404 });
    }

    const lines = booking.costSheet.map((c) => ({
      serviceType: c.serviceType,
      serviceName: c.serviceName,
      supplierName: c.supplierName,
      amount: kind === "customer" ? c.sellingPrice : c.bookingCost,
    }));
    const total = lines.reduce((sum, l) => sum + l.amount, 0);

    const buffer = await renderInvoicePdf({
      kind,
      bookingCode: bookingCode(booking.seq),
      customerName: booking.lead.customerName,
      destinationName: booking.destination.name,
      invoiceDate: new Date().toLocaleDateString("en-IN"),
      lines,
      total,
    });

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${bookingCode(booking.seq)}-${kind}-invoice.pdf"`,
      },
    });
  } catch (err) {
    console.error("[/api/admin/bookings/[id]/invoice] GET", err);
    return NextResponse.json({ success: false, message: "Internal error", data: null }, { status: 500 });
  }
}
