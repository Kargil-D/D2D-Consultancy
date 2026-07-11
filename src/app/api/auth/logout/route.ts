import { withApiHandler, ok } from "@/lib/apiHandler";
import { getRefreshTokenCookie, clearAuthCookies } from "@/lib/authCookies";
import { revokeRefreshToken } from "@/services/tokenService";

export const runtime = "nodejs";

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Revoke the current refresh token and clear session cookies
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logged out
 */
export const POST = withApiHandler("[/api/auth/logout] POST", async (req) => {
  const raw = getRefreshTokenCookie(req);
  if (raw) await revokeRefreshToken(raw);

  const res = ok({}, "Logged out");
  clearAuthCookies(res);
  return res;
});
