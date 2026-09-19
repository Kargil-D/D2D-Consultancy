import { NextResponse, type NextRequest } from "next/server";
import { toggleItineraryStatus } from "@/services/campaignItineraryService";
import { ApiError } from "@/lib/apiError";
import { requireModuleAccess } from "@/lib/permissions";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireModuleAccess(req, "Campaigns", "canEdit");

    const { id } = await ctx.params;
    const updated = await toggleItineraryStatus(id);
    return NextResponse.json({ success: true, message: "Status updated", data: updated });
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ success: false, message: err.message, data: null }, { status: err.statusCode });
    console.error("[/api/admin/itineraries/[id]/toggle-status] POST", err);
    return NextResponse.json({ success: false, message: "Internal error", data: null }, { status: 500 });
  }
}
