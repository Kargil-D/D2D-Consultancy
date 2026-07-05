import { NextResponse } from "next/server";
import { listItineraries, createItinerary } from "@/services/campaignItineraryService";
import { ItineraryCreateSchema } from "@/lib/validation/itinerary";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("search") ?? undefined;
    const page = Number(url.searchParams.get("page") ?? "1");
    const pageSize = Number(url.searchParams.get("pageSize") ?? "10");
    const packageId = url.searchParams.get("packageId") ?? undefined;

    const filter: Record<string, unknown> = {};
    if (packageId) filter.packageId = packageId;

    const data = await listItineraries({ search, page, pageSize, filter });
    return NextResponse.json({ success: true, message: "OK", data });
  } catch (err) {
    console.error("[/api/admin/itineraries] GET", err);
    return NextResponse.json({ success: false, message: "Internal error", data: null }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const parsed = ItineraryCreateSchema.parse(payload);
    const created = await createItinerary(parsed);
    return NextResponse.json({ success: true, message: "Created", data: created });
  } catch (err) {
    console.error("[/api/admin/itineraries] POST", err);
    const msg = err instanceof Error ? err.message : "Invalid payload";
    return NextResponse.json({ success: false, message: msg, data: null }, { status: 400 });
  }
}
