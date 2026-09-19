import { NextResponse, type NextRequest } from "next/server";
import { listHotels, createHotel } from "@/services/campaignHotelService";
import { HotelCreateSchema } from "@/lib/validation/hotel";
import { ApiError } from "@/lib/apiError";
import { CAMPAIGN_PLAN_READ_MODULES, requireAnyModuleAccess, requireModuleAccess } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  try {
    await requireAnyModuleAccess(req, CAMPAIGN_PLAN_READ_MODULES, "canView");

    const url = new URL(req.url);
    const page = Number(url.searchParams.get("page") ?? "1");
    const pageSize = Number(url.searchParams.get("pageSize") ?? "10");
    const packageId = url.searchParams.get("packageId") ?? undefined;

    const filter: Record<string, unknown> = {};
    if (packageId) filter.packageId = packageId;

    const data = await listHotels({ page, pageSize, filter });
    return NextResponse.json({ success: true, message: "OK", data });
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ success: false, message: err.message, data: null }, { status: err.statusCode });
    console.error("[/api/admin/hotels] GET", err);
    return NextResponse.json({ success: false, message: "Internal error", data: null }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireModuleAccess(req, "Campaigns", "canAdd");

    const payload = await req.json();
    const parsed = HotelCreateSchema.parse(payload);
    const created = await createHotel(parsed);
    return NextResponse.json({ success: true, message: "Created", data: created });
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ success: false, message: err.message, data: null }, { status: err.statusCode });
    console.error("[/api/admin/hotels] POST", err);
    const msg = err instanceof Error ? err.message : "Invalid payload";
    return NextResponse.json({ success: false, message: msg, data: null }, { status: 400 });
  }
}
