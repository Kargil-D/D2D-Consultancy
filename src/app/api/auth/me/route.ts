import { withApiHandler, ok } from "@/lib/apiHandler";
import { ApiError } from "@/lib/apiError";
import { getAccessTokenCookie } from "@/lib/authCookies";
import { verifyAccessToken } from "@/lib/jwt";
import { findUserById, toPublicUser } from "@/services/userService";

export const runtime = "nodejs";

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get the currently authenticated user
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Current user profile
 *         content:
 *           application/json:
 *             example: { success: true, message: "OK", data: { user: { id: "...", name: "Jane Doe", email: "jane@example.com", roles: ["customer"] } } }
 *       401:
 *         description: Not authenticated
 */
export const GET = withApiHandler("[/api/auth/me] GET", async (req) => {
  const token = getAccessTokenCookie(req);
  if (!token) throw new ApiError(401, "Not authenticated");

  const payload = await verifyAccessToken(token);
  const user = await findUserById(payload.sub);
  if (!user) throw new ApiError(401, "Not authenticated");

  return ok({ user: toPublicUser(user) });
});
