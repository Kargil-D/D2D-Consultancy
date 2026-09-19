import { NextResponse, type NextRequest } from "next/server";
import { getItinerary, updateItinerary, removeItinerary } from "@/services/campaignItineraryService";
import { ItineraryUpdateSchema } from "@/lib/validation/itinerary";
import { ApiError } from "@/lib/apiError";
import { CAMPAIGN_PLAN_READ_MODULES, requireAnyModuleAccess, requireModuleAccess } from "@/lib/permissions";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireAnyModuleAccess(req, CAMPAIGN_PLAN_READ_MODULES, "canView");

    const { id } = await ctx.params;
    const rec = await getItinerary(id);
    return NextResponse.json({ success: true, message: "OK", data: rec });
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ success: false, message: err.message, data: null }, { status: err.statusCode });
    console.error("[/api/admin/itineraries/[id]] GET", err);
    return NextResponse.json({ success: false, message: "Internal error", data: null }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireModuleAccess(req, "Campaigns", "canEdit");

    const { id } = await ctx.params;
    const payload = await req.json();
    const parsed = ItineraryUpdateSchema.parse(payload);
    const updated = await updateItinerary(id, parsed);
    return NextResponse.json({ success: true, message: "Updated", data: updated });
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ success: false, message: err.message, data: null }, { status: err.statusCode });
    console.error("[/api/admin/itineraries/[id]] PUT", err);
    const msg = err instanceof Error ? err.message : "Invalid payload";
    return NextResponse.json({ success: false, message: msg, data: null }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireModuleAccess(req, "Campaigns", "canDelete");

    const { id } = await ctx.params;
    await removeItinerary(id);
    return NextResponse.json({ success: true, message: "Deleted", data: true });
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ success: false, message: err.message, data: null }, { status: err.statusCode });
    console.error("[/api/admin/itineraries/[id]] DELETE", err);
    return NextResponse.json({ success: false, message: "Internal error", data: null }, { status: 500 });
  }
}
