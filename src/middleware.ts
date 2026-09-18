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

// Direct-navigation (plain <a href>, not fetch/apiClient) document downloads under the customer
// account area. These never go through apiClient's fetch() and so never see the JSON 401 it
// could otherwise retry-on-refresh (it doesn't do that yet anyway) — a browser tab just gets a
// bare 401 body once the 15-minute access token expires, even mid-session. Routing them through
// this same "silent refresh, then bounce to the original URL" flow fixes that: a genuine
// full-page navigation follows the redirect chain transparently and lands on the PDF either way.
const CUSTOMER_DOCUMENT_PATHS = [
  "/api/customer/bookings/:id/travel-voucher",
  "/api/customer/bookings/:id/hotel-voucher",
  "/api/customer/bookings/:id/payment-acknowledgement",
];

/** Gates every /admin/** page (not just the API calls they make) behind a real staff session, plus
 * the customer document-download routes above. Logged-out visitors and Customer-role accounts are
 * bounced to /admin/login from /admin/**; non-Admin staff hitting an Admin-only section are
 * bounced to /admin. Document routes with no valid session just fall through to their own route
 * handler, which returns its usual JSON 401 (no HTML login page for those). */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();
  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");

  const token = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value;

  if (token) {
    try {
      const payload = await verifyAccessToken(token);
      if (isAdminPage && payload.role !== "Customer") {
        const needsAdmin = ADMIN_ONLY_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
        if (needsAdmin && payload.role !== "Admin") {
          return NextResponse.redirect(new URL("/admin", req.url));
        }
      }
      return NextResponse.next();
    } catch {
      // Missing/expired/invalid token — fall through below.
    }
  }

  // Access token is gone/expired/invalid. Instead of forcing a re-login outright (which used to
  // happen on every ~15-minute access-token expiry, even mid-session), hand off to a Node-runtime
  // route that can do the Prisma-backed refresh-token rotation this Edge-runtime middleware can't
  // — but only bother if a refresh token cookie is actually present, to avoid a pointless redirect
  // for genuinely logged-out visitors.
  if (pathname !== "/api/auth/refresh-and-continue" && req.cookies.get(REFRESH_TOKEN_COOKIE)?.value) {
    const refreshUrl = req.nextUrl.clone();
    refreshUrl.pathname = "/api/auth/refresh-and-continue";
    refreshUrl.search = `redirect=${encodeURIComponent(pathname + req.nextUrl.search)}`;
    return NextResponse.redirect(refreshUrl);
  }

  // No refresh token either. For an /admin/** page, bounce to the staff login screen. For a
  // document route, let it through — its own getCurrentUser() call returns a clean JSON 401
  // rather than an HTML login page an <a href> PDF link has no good way to show.
  if (!isAdminPage) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  url.search = `redirect=${encodeURIComponent(pathname)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*", ...CUSTOMER_DOCUMENT_PATHS],
};
