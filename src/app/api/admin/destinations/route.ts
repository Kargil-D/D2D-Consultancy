import { NextResponse, type NextRequest } from "next/server";
import { listDestinations, listDestinationOptions, createDestination } from "@/services/destinationService";
import { DestinationCreateSchema } from "@/lib/validation/destination";
import { toSlug } from "@/utils/slug";
import { ApiError } from "@/lib/apiError";
import { DESTINATION_LOOKUP_MODULES, requireAnyModuleAccess, requireModuleAccess } from "@/lib/permissions";

/** Read-only lookup for every screen that picks a destination (see DESTINATION_LOOKUP_MODULES) — not just
 * the Destinations module, or e.g. a Sales user's Hotel Master / Activities forms load an empty dropdown. */
export async function GET(req: NextRequest) {
  try {
    await requireAnyModuleAccess(req, DESTINATION_LOOKUP_MODULES, "canView");

    const url = new URL(req.url);

    // Lightweight id+name list for dropdowns — skips the cities join and full rows.
    if (url.searchParams.get("view") === "options") {
      const options = await listDestinationOptions();
      return NextResponse.json({ success: true, message: "OK", data: options });
    }

    const search = url.searchParams.get("search") ?? undefined;
    const page = Number(url.searchParams.get("page") ?? "1");
    const pageSize = Number(url.searchParams.get("pageSize") ?? "10");
    const filterCountry = url.searchParams.get("country") ?? undefined;

    const filter: Record<string, unknown> = {};
    if (filterCountry) filter.country = filterCountry;

    const data = await listDestinations({ search, page, pageSize, filter });
    return NextResponse.json({ success: true, message: "OK", data });
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ success: false, message: err.message, data: null }, { status: err.statusCode });
    console.error("[/api/admin/destinations] GET", err);
    return NextResponse.json({ success: false, message: "Internal error", data: null }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireModuleAccess(req, "Destinations", "canAdd");

    const payload = await req.json();
    const { cityIds, ...parsed } = DestinationCreateSchema.parse(payload);
    const created = await createDestination(
      {
        ...parsed,
        slug: parsed.slug?.trim() || toSlug(parsed.name),
      },
      cityIds ?? [],
    );
    return NextResponse.json({ success: true, message: "Created", data: created });
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ success: false, message: err.message, data: null }, { status: err.statusCode });
    console.error("[/api/admin/destinations] POST", err);
    const msg = err instanceof Error ? err.message : "Invalid payload";
    return NextResponse.json({ success: false, message: msg, data: null }, { status: 400 });
  }
}
