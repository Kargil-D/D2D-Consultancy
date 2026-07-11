import type { NextRequest, NextResponse } from "next/server";
import { REFRESH_TOKEN_TTL_DAYS } from "@/lib/refreshToken";

export const ACCESS_TOKEN_COOKIE = "d2d_access_token";
export const REFRESH_TOKEN_COOKIE = "d2d_refresh_token";

const isProd = process.env.NODE_ENV === "production";

export function setAuthCookies(res: NextResponse, accessToken: string, refreshToken: string) {
  res.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 15 * 60,
  });
  res.cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/api/auth",
    maxAge: REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60,
  });
}

export function clearAuthCookies(res: NextResponse) {
  res.cookies.set(ACCESS_TOKEN_COOKIE, "", { httpOnly: true, secure: isProd, sameSite: "lax", path: "/", maxAge: 0 });
  res.cookies.set(REFRESH_TOKEN_COOKIE, "", { httpOnly: true, secure: isProd, sameSite: "lax", path: "/api/auth", maxAge: 0 });
}

export function getAccessTokenCookie(req: NextRequest): string | undefined {
  return req.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
}

export function getRefreshTokenCookie(req: NextRequest): string | undefined {
  return req.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
}
