import { withApiHandler, ok } from "@/lib/apiHandler";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * @swagger
 * /api/customer/activities:
 *   get:
 *     summary: List the current customer's confirmed bookings ("Your Activities")
 *     tags: [Customer]
 *     responses:
 *       200:
 *         description: Bookings (Confirmed, VoucherGenerated, or Booked) whose lead matches the logged-in user's email
 *       401:
 *         description: Not authenticated
 */
export const GET = withApiHandler("[/api/customer/activities] GET", async (req) => {
  const user = await getCurrentUser(req);

  const bookings = await prisma.booking.findMany({
    where: {
      isDeleted: false,
      status: { in: ["Confirmed", "VoucherGenerated", "Booked"] },
      lead: { email: { equals: user.email, mode: "insensitive" } },
    },
    include: { destination: true, lead: true },
    orderBy: { createdDate: "desc" },
  });

  return ok({ bookings });
});
