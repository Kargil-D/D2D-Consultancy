import { NextResponse, type NextRequest } from "next/server";
import { getActivity, updateActivity, removeActivity } from "@/services/activityService";
import { ActivityUpdateSchema } from "@/lib/validation/activity";
import { ApiError } from "@/lib/apiError";
import { requireModuleAccess } from "@/lib/permissions";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireModuleAccess(req, "Activities", "canView");
    const { id } = await ctx.params;
    const rec = await getActivity(id);
    return NextResponse.json({ success: true, message: "OK", data: rec });
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ success: false, message: err.message, data: null }, { status: err.statusCode });
    console.error("[/api/admin/activities/[id]] GET", err);
    return NextResponse.json({ success: false, message: "Internal error", data: null }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireModuleAccess(req, "Activities", "canEdit");
    const { id } = await ctx.params;
    const payload = await req.json();
    const { cityIds, ...parsed } = ActivityUpdateSchema.parse(payload);
    const updated = await updateActivity(id, parsed, cityIds);
    return NextResponse.json({ success: true, message: "Updated", data: updated });
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ success: false, message: err.message, data: null }, { status: err.statusCode });
    console.error("[/api/admin/activities/[id]] PUT", err);
    const msg = err instanceof Error ? err.message : "Invalid payload";
    return NextResponse.json({ success: false, message: msg, data: null }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireModuleAccess(req, "Activities", "canDelete");
    const { id } = await ctx.params;
    await removeActivity(id);
    return NextResponse.json({ success: true, message: "Deleted", data: true });
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ success: false, message: err.message, data: null }, { status: err.statusCode });
    console.error("[/api/admin/activities/[id]] DELETE", err);
    return NextResponse.json({ success: false, message: "Internal error", data: null }, { status: 500 });
  }
}
