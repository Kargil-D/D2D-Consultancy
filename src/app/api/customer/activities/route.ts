import { withApiHandler, ok } from "@/lib/apiHandler";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { bookingTotalPrice } from "@/lib/quotationPricing";

export const runtime = "nodejs";

/**
 * @swagger
 * /api/customer/activities:
 *   get:
 *     summary: List the current customer's confirmed bookings ("Your Activities")
 *     tags: [Customer]
 *     responses:
 *       200:
 *         description: Bookings (Booked, OnTrip, or Completed) whose lead matches the logged-in user's email
 *       401:
 *         description: Not authenticated
 */
export const GET = withApiHandler("[/api/customer/activities] GET", async (req) => {
  const user = await getCurrentUser(req);

  const bookings = await prisma.booking.findMany({
    where: {
      isDeleted: false,
      status: { in: ["Booked", "OnTrip", "Completed"] },
      lead: { email: { equals: user.email, mode: "insensitive" } },
    },
    omit: { hotelVoucher: true, hotelVoucherHash: true, paymentReceipt: true, paymentReceiptHash: true },
    include: {
      destination: true,
      lead: true,
      customerPayments: { select: { amount: true } },
      // Select only — never spread into the response below, since items[].cost is internal
      // supplier cost/margin data that must never reach a customer-facing route.
      quotation: { select: { marginPercent: true, gstPercent: true, items: { select: { qty: true, cost: true } } } },
    },
    orderBy: { createdDate: "desc" },
  });

  // Same figure the admin booking header ("Deal Price") and the Customer Payments cap use —
  // the raw totalAmount column is only a fallback for bookings with no linked quotation.
  const shaped = bookings.map(({ quotation, ...b }) => ({ ...b, totalAmount: bookingTotalPrice({ totalAmount: b.totalAmount, quotation }) ?? b.totalAmount }));

  return ok({ bookings: shaped });
});
