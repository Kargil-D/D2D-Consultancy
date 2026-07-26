import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAccessToken } from "@/lib/jwt";

// Duplicated from src/lib/authCookies.ts rather than imported — that module pulls in
// src/lib/refreshToken.ts, which uses Node's `crypto` module and isn't available in the
// Edge runtime middleware executes in. verifyAccessToken (jose + apiError) is safe to import.
const ACCESS_TOKEN_COOKIE = "d2d_access_token";

/** Gates every /admin/** page (not just the API calls they make) behind a real staff session. Logged-out visitors and Customer-role accounts are bounced to /admin/login. */
export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname === "/admin/login") return NextResponse.next();

  const token = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value;

  if (token) {
    try {
      const payload = await verifyAccessToken(token);
      if (payload.role !== "Customer") {
        return NextResponse.next();
      }
    } catch {
      // Missing/expired/invalid token — fall through to the login redirect below.
    }
  }

  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  url.search = `redirect=${encodeURIComponent(req.nextUrl.pathname)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*"],
};
