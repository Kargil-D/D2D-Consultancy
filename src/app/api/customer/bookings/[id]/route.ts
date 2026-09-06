import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ApiError } from "@/lib/apiError";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * @swagger
 * /api/customer/bookings/{id}:
 *   get:
 *     summary: Get one of the current customer's own confirmed bookings, with payment and timeline history
 *     tags: [Customer]
 *     responses:
 *       200:
 *         description: Booking matching the logged-in user's email
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: No matching booking
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(req);
    const { id } = await ctx.params;

    const booking = await prisma.booking.findFirst({
      where: {
        id,
        isDeleted: false,
        status: { in: ["Booked", "OnTrip", "Completed", "Cancelled"] },
        lead: { email: { equals: user.email, mode: "insensitive" } },
      },
      include: {
        destination: true,
        lead: true,
        customerPayments: { orderBy: { paymentDate: "desc" } },
        timeline: { orderBy: { createdDate: "desc" } },
      },
    });

    if (!booking) throw new ApiError(404, "Booking not found");

    return NextResponse.json({ success: true, message: "OK", data: { booking } });
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ success: false, message: err.message, data: null }, { status: err.statusCode });
    console.error("[/api/customer/bookings/[id]] GET", err);
    return NextResponse.json({ success: false, message: "Internal error", data: null }, { status: 500 });
  }
}
