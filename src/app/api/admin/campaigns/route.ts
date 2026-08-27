import { NextResponse, type NextRequest } from "next/server";
import { listCampaigns, listCampaignOptions, createCampaign } from "@/services/campaignService";
import { CampaignCreateSchema } from "@/lib/validation/campaign";
import { toSlug } from "@/utils/slug";
import { ApiError } from "@/lib/apiError";
import { requireModuleAccess } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  try {
    await requireModuleAccess(req, "Campaigns", "canView");
    const url = new URL(req.url);
    const search = url.searchParams.get("search") ?? undefined;
    const page = Number(url.searchParams.get("page") ?? "1");
    const pageSize = Number(url.searchParams.get("pageSize") ?? "10");
    const destinationId = url.searchParams.get("destinationId") ?? undefined;

    // Lightweight id+name list for dropdowns — a full campaign row carries its activities
    // JSON, gallery and pricing fields, which a name-only select never renders.
    if (url.searchParams.get("view") === "options") {
      const options = await listCampaignOptions(destinationId);
      return NextResponse.json({ success: true, message: "OK", data: options });
    }

    const filter: Record<string, unknown> = {};
    if (destinationId) filter.destinationId = destinationId;

    const data = await listCampaigns({ search, page, pageSize, filter });
    return NextResponse.json({ success: true, message: "OK", data });
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ success: false, message: err.message, data: null }, { status: err.statusCode });
    console.error("[/api/admin/campaigns] GET", err);
    return NextResponse.json({ success: false, message: "Internal error", data: null }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireModuleAccess(req, "Campaigns", "canAdd");
    const payload = await req.json();
    const parsed = CampaignCreateSchema.parse(payload);
    const created = await createCampaign({
      ...parsed,
      slug: parsed.slug?.trim() || toSlug(parsed.name),
    });
    return NextResponse.json({ success: true, message: "Created", data: created });
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ success: false, message: err.message, data: null }, { status: err.statusCode });
    console.error("[/api/admin/campaigns] POST", err);
    const msg = err instanceof Error ? err.message : "Invalid payload";
    return NextResponse.json({ success: false, message: msg, data: null }, { status: 400 });
  }
}
