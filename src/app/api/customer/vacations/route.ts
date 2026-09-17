import { withApiHandler, ok } from "@/lib/apiHandler";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * @swagger
 * /api/customer/vacations:
 *   get:
 *     summary: List the current customer's own leads ("Your Vacations")
 *     tags: [Customer]
 *     responses:
 *       200:
 *         description: Leads matching the logged-in user's email
 *       401:
 *         description: Not authenticated
 */
export const GET = withApiHandler("[/api/customer/vacations] GET", async (req) => {
  const user = await getCurrentUser(req);

  const leads = await prisma.lead.findMany({
    where: { isDeleted: false, email: { equals: user.email, mode: "insensitive" } },
    include: {
      destination: true,
      // Only statuses the customer is meant to see — matches the gate in
      // /api/customer/bookings/[id] and /api/customer/activities. "Won" is the
      // internal in-progress stage right after conversion and stays hidden.
      bookings: {
        where: { isDeleted: false, status: { in: ["Booked", "OnTrip", "Completed", "Cancelled"] } },
        select: { id: true, status: true },
      },
    },
    orderBy: { createdDate: "desc" },
  });

  return ok({ leads });
});
