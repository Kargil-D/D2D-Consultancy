import { withApiHandler, ok } from "@/lib/apiHandler";
import { getCurrentUser } from "@/lib/auth";
import { UpdateProfileSchema } from "@/lib/validation/customer";
import { updateOwnProfile } from "@/services/userService";

export const runtime = "nodejs";

/**
 * @swagger
 * /api/customer/account:
 *   get:
 *     summary: Get the current customer's own profile (name + mobile number only)
 *     tags: [Customer]
 *     responses:
 *       200:
 *         description: Current profile
 *       401:
 *         description: Not authenticated
 *   put:
 *     summary: Update the current customer's own profile (name + mobile number only)
 *     tags: [Customer]
 *     responses:
 *       200:
 *         description: Updated profile
 *       400:
 *         description: Invalid payload
 *       401:
 *         description: Not authenticated
 */
export const GET = withApiHandler("[/api/customer/account] GET", async (req) => {
  const user = await getCurrentUser(req);
  return ok({
    firstName: user.firstName,
    lastName: user.lastName,
    phoneNumber: user.phoneNumber,
    email: user.email,
  });
});

export const PUT = withApiHandler("[/api/customer/account] PUT", async (req) => {
  const user = await getCurrentUser(req);
  const payload = UpdateProfileSchema.parse(await req.json());

  const updated = await updateOwnProfile(user.id, {
    firstName: payload.firstName,
    lastName: payload.lastName,
    phoneNumber: payload.phoneNumber ?? null,
  });

  return ok(
    {
      firstName: updated.firstName,
      lastName: updated.lastName,
      phoneNumber: updated.phoneNumber,
      email: updated.email,
    },
    "Profile updated",
  );
});
