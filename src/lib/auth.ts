import type { NextRequest } from "next/server";
import { ApiError } from "@/lib/apiError";
import { getAccessTokenCookie } from "@/lib/authCookies";
import { verifyAccessToken } from "@/lib/jwt";
import { findUserById } from "@/services/userService";

/** Resolves the logged-in user from the access-token cookie, same check as /api/auth/me. */
export async function getCurrentUser(req: NextRequest) {
  const token = getAccessTokenCookie(req);
  if (!token) throw new ApiError(401, "Not authenticated");

  const payload = await verifyAccessToken(token);
  const user = await findUserById(payload.sub);
  if (!user) throw new ApiError(401, "Not authenticated");
  if (user.role.status === "Inactive") throw new ApiError(401, "This role has been deactivated. Please contact an administrator.");

  return user;
}
