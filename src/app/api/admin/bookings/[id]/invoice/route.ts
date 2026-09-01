import { NextResponse, type NextRequest } from "next/server";
import { getBooking, bookingCode, requireBookingAccess } from "@/services/bookingService";
import { renderInvoicePdf } from "@/lib/bookingInvoicePdf";
import { ApiError } from "@/lib/apiError";
import { requireModuleAccess, toViewer } from "@/lib/permissions";

export const runtime = "nodejs";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireModuleAccess(req, "Bookings", "canView");
    const { id } = await ctx.params;
    await requireBookingAccess(id, toViewer(user));
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
      bookingCode: bookingCode(booking.lead.seq),
      customerName: booking.lead.customerName,
      destinationName: booking.destination.name,
      invoiceDate: new Date().toLocaleDateString("en-IN"),
      lines,
      total,
    });

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${bookingCode(booking.lead.seq)}-${kind}-invoice.pdf"`,
      },
    });
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ success: false, message: err.message, data: null }, { status: err.statusCode });
    console.error("[/api/admin/bookings/[id]/invoice] GET", err);
    return NextResponse.json({ success: false, message: "Internal error", data: null }, { status: 500 });
  }
}
