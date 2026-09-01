import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAccessToken } from "@/lib/jwt";

// Duplicated from src/lib/authCookies.ts rather than imported — that module pulls in
// src/lib/refreshToken.ts, which uses Node's `crypto` module and isn't available in the
// Edge runtime middleware executes in. verifyAccessToken (jose + apiError) is safe to import.
const ACCESS_TOKEN_COOKIE = "d2d_access_token";
const REFRESH_TOKEN_COOKIE = "d2d_refresh_token";

// Locker (Employees + Roles — sensitive HR/RBAC data) and Roster Management are Admin-only,
// not just staff-only. /admin/my-roster (self-view) is deliberately excluded — any staff member
// may see their own attendance.
const ADMIN_ONLY_PREFIXES = ["/admin/locker", "/admin/employees", "/admin/roles", "/admin/roster", "/admin/lead-assignment"];

/** Gates every /admin/** page (not just the API calls they make) behind a real staff session. Logged-out visitors and Customer-role accounts are bounced to /admin/login; non-Admin staff hitting an Admin-only section are bounced to /admin. */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();

  const token = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value;

  if (token) {
    try {
      const payload = await verifyAccessToken(token);
      if (payload.role !== "Customer") {
        const needsAdmin = ADMIN_ONLY_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
        if (needsAdmin && payload.role !== "Admin") {
          return NextResponse.redirect(new URL("/admin", req.url));
        }
        return NextResponse.next();
      }
    } catch {
      // Missing/expired/invalid token — fall through below.
    }
  }

  // Access token is gone/expired/invalid. Instead of forcing a re-login outright (which used to
  // happen on every ~15-minute access-token expiry, even mid-session), hand off to a Node-runtime
  // route that can do the Prisma-backed refresh-token rotation this Edge-runtime middleware can't
  // — but only bother if a refresh token cookie is actually present, to avoid a pointless redirect
  // for genuinely logged-out visitors.
  if (req.cookies.get(REFRESH_TOKEN_COOKIE)?.value) {
    const refreshUrl = req.nextUrl.clone();
    refreshUrl.pathname = "/api/auth/refresh-and-continue";
    refreshUrl.search = `redirect=${encodeURIComponent(pathname + req.nextUrl.search)}`;
    return NextResponse.redirect(refreshUrl);
  }

  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  url.search = `redirect=${encodeURIComponent(pathname)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*"],
};
