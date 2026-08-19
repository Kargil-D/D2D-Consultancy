import { NextResponse, type NextRequest } from "next/server";
import { listActivities, createActivity } from "@/services/activityService";
import { ActivityCreateSchema } from "@/lib/validation/activity";
import { ApiError } from "@/lib/apiError";
import { requireModuleAccess } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  try {
    await requireModuleAccess(req, "Activities", "canView");

    const url = new URL(req.url);
    const search = url.searchParams.get("search") ?? undefined;
    const page = Number(url.searchParams.get("page") ?? "1");
    const pageSize = Number(url.searchParams.get("pageSize") ?? "10");
    const destinationId = url.searchParams.get("destinationId") ?? undefined;
    const cityId = url.searchParams.get("cityId") ?? undefined;
    const status = url.searchParams.get("status") ?? undefined;

    const filter: Record<string, unknown> = {};
    if (destinationId) filter.destinationId = destinationId;
    if (cityId) filter.cities = { some: { cityId } };
    if (status) filter.status = status;

    const data = await listActivities({ search, page, pageSize, filter });
    return NextResponse.json({ success: true, message: "OK", data });
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ success: false, message: err.message, data: null }, { status: err.statusCode });
    console.error("[/api/admin/activities] GET", err);
    return NextResponse.json({ success: false, message: "Internal error", data: null }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireModuleAccess(req, "Activities", "canAdd");

    const payload = await req.json();
    const { cityIds, ...parsed } = ActivityCreateSchema.parse(payload);
    const created = await createActivity(parsed, cityIds);
    return NextResponse.json({ success: true, message: "Created", data: created });
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ success: false, message: err.message, data: null }, { status: err.statusCode });
    console.error("[/api/admin/activities] POST", err);
    const msg = err instanceof Error ? err.message : "Invalid payload";
    return NextResponse.json({ success: false, message: msg, data: null }, { status: 400 });
  }
}
