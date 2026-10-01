import crypto from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { syncGoogleSheets } from "@/services/sheetSyncService";
import { ApiError } from "@/lib/apiError";

export const maxDuration = 60;

/** Constant-time compare of the "Authorization: Bearer <CRON_SECRET>" header Vercel Cron sends. */
function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  // No secret configured → refuse outright rather than leaving the endpoint open.
  if (!secret) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(req.headers.get("authorization") ?? "");
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

/** Scheduled by vercel.json "crons": rewrites both Google Sheets (Leads + Bookings). */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ success: false, message: "Unauthorized", data: null }, { status: 401 });
  }
  try {
    const data = await syncGoogleSheets();
    return NextResponse.json({ success: true, message: "Synced", data });
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ success: false, message: err.message, data: null }, { status: err.statusCode });
    console.error("[/api/cron/sheet-sync] GET", err);
    return NextResponse.json({ success: false, message: "Internal error", data: null }, { status: 500 });
  }
}
