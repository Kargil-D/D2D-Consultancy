import { NextResponse, type NextRequest } from "next/server";
import { listCities, findOrCreateCity } from "@/services/cityService";
import { CityCreateSchema } from "@/lib/validation/city";
import { ApiError } from "@/lib/apiError";
import { requireModuleAccess } from "@/lib/permissions";

/** Backs the Destination form's City multi-select. Gated under the Destinations module — City
 * has no admin screen of its own yet, it's a lookup master shared by whichever entity forms
 * (Destinations today; Activities/Hotels/Transfers/Packages/Itinerary later) embed the select. */
export async function GET(req: NextRequest) {
  try {
    await requireModuleAccess(req, "Destinations", "canView");

    const url = new URL(req.url);
    const search = url.searchParams.get("search") ?? undefined;
    const page = Number(url.searchParams.get("page") ?? "1");
    const pageSize = Number(url.searchParams.get("pageSize") ?? "20");
    const country = url.searchParams.get("country") ?? undefined;

    const data = await listCities({ search, page, pageSize, country });
    return NextResponse.json({ success: true, message: "OK", data });
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ success: false, message: err.message, data: null }, { status: err.statusCode });
    console.error("[/api/admin/cities] GET", err);
    return NextResponse.json({ success: false, message: "Internal error", data: null }, { status: 500 });
  }
}

/** Find-or-create: used when the user types a city that isn't in the master yet. */
export async function POST(req: NextRequest) {
  try {
    await requireModuleAccess(req, "Destinations", "canAdd");

    const payload = await req.json();
    const parsed = CityCreateSchema.parse(payload);
    const created = await findOrCreateCity(parsed.name, parsed.country ?? undefined);
    return NextResponse.json({ success: true, message: "Created", data: created });
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ success: false, message: err.message, data: null }, { status: err.statusCode });
    console.error("[/api/admin/cities] POST", err);
    const msg = err instanceof Error ? err.message : "Invalid payload";
    return NextResponse.json({ success: false, message: msg, data: null }, { status: 400 });
  }
}
