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
    include: { destination: true },
    orderBy: { createdDate: "desc" },
  });

  return ok({ leads });
});
