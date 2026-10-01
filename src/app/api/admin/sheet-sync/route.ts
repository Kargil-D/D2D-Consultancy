import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { getSheetSyncStatus, syncGoogleSheets } from "@/services/sheetSyncService";
import { SheetSyncSchema } from "@/lib/validation/sheetSync";
import { ApiError } from "@/lib/apiError";
import { requireAdmin } from "@/lib/permissions";

export const maxDuration = 60;

/** Admin-only: whether the Google Sheet sync is configured, and each sheet's link. */
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    return NextResponse.json({ success: true, message: "OK", data: getSheetSyncStatus() });
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ success: false, message: err.message, data: null }, { status: err.statusCode });
    console.error("[/api/admin/sheet-sync] GET", err);
    return NextResponse.json({ success: false, message: "Internal error", data: null }, { status: 500 });
  }
}

/** Admin-only "Sync now" for one sheet ({ target: "leads" | "bookings" }) — same full rewrite the
 * daily cron does. Admin-gated because the sheets hold every lead's and customer's contact
 * details, regardless of who they're assigned to. */
export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
    const { target } = SheetSyncSchema.parse(await req.json().catch(() => ({})));
    const data = await syncGoogleSheets([target]);
    return NextResponse.json({ success: true, message: "Synced", data });
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ success: false, message: err.message, data: null }, { status: err.statusCode });
    if (err instanceof ZodError) return NextResponse.json({ success: false, message: "Invalid sheet target", data: null }, { status: 400 });
    console.error("[/api/admin/sheet-sync] POST", err);
    return NextResponse.json({ success: false, message: "Google Sheet sync failed", data: null }, { status: 500 });
  }
}
