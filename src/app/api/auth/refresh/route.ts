import { withApiHandler, ok } from "@/lib/apiHandler";
import { ApiError } from "@/lib/apiError";
import { getRefreshTokenCookie, setAuthCookies } from "@/lib/authCookies";
import { rotateRefreshToken } from "@/services/tokenService";

export const runtime = "nodejs";

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Rotate the refresh token and issue a new access token
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: New session cookies set
 *       401:
 *         description: Missing, revoked, or expired refresh token
 */
export const POST = withApiHandler("[/api/auth/refresh] POST", async (req) => {
  const raw = getRefreshTokenCookie(req);
  if (!raw) throw new ApiError(401, "Session expired. Please log in again.");

  const { accessToken, refreshToken } = await rotateRefreshToken(raw);

  const res = ok({}, "Session refreshed");
  setAuthCookies(res, accessToken, refreshToken);
  return res;
});
