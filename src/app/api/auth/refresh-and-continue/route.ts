import { NextResponse, type NextRequest } from "next/server";
import { getRefreshTokenCookie, setAuthCookies } from "@/lib/authCookies";
import { rotateRefreshToken } from "@/services/tokenService";

export const runtime = "nodejs";

/**
 * middleware.ts runs in the Edge runtime, which can't do the Prisma-backed refresh-token
 * rotation (needs Node's `crypto`). When it sees an expired access token but a refresh token
 * cookie is still present, it redirects here instead of straight to /admin/login — this route
 * does the actual rotation, sets fresh cookies, then bounces back to the page the user was
 * originally headed to, so a ~15-minute access-token expiry no longer forces a re-login as long
 * as the 7-day refresh token is still valid.
 */
export async function GET(req: NextRequest) {
  const requested = req.nextUrl.searchParams.get("redirect") || "/admin";
  // Guard against an open redirect (must be a same-site relative path) and, more importantly,
  // against ever redirecting back into this same route — if `redirect` were ever this route's
  // own URL (e.g. a request racing the one that already rotated the token, replaying a stale
  // `redirect` param), following it blindly recurses forever, wrapping the URL in another layer
  // of encoding each hop until the browser gives up with ERR_TOO_MANY_REDIRECTS.
  const isSafeRelativePath = requested.startsWith("/") && !requested.startsWith("//");
  const redirectTo = isSafeRelativePath && !requested.startsWith("/api/auth/refresh-and-continue") ? requested : "/admin";

  const loginUrl = new URL("/admin/login", req.url);
  loginUrl.search = `redirect=${encodeURIComponent(redirectTo)}`;

  const raw = getRefreshTokenCookie(req);
  if (!raw) return NextResponse.redirect(loginUrl);

  try {
    const { accessToken, refreshToken } = await rotateRefreshToken(raw);
    const res = NextResponse.redirect(new URL(redirectTo, req.url));
    setAuthCookies(res, accessToken, refreshToken);
    return res;
  } catch {
    return NextResponse.redirect(loginUrl);
  }
}
