import { NextResponse } from "next/server";
import { listDestinations, createDestination } from "@/services/destinationService";
import { DestinationCreateSchema } from "@/lib/validation/destination";
import { toSlug } from "@/utils/slug";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("search") ?? undefined;
    const page = Number(url.searchParams.get("page") ?? "1");
    const pageSize = Number(url.searchParams.get("pageSize") ?? "10");
    const filterCountry = url.searchParams.get("country") ?? undefined;

    const filter: Record<string, unknown> = {};
    if (filterCountry) filter.country = filterCountry;

    const data = await listDestinations({ search, page, pageSize, filter });
    return NextResponse.json({ success: true, message: "OK", data });
  } catch (err) {
    console.error("[/api/admin/destinations] GET", err);
    return NextResponse.json({ success: false, message: "Internal error", data: null }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const parsed = DestinationCreateSchema.parse(payload);
    const created = await createDestination({
      ...parsed,
      slug: parsed.slug?.trim() || toSlug(parsed.name),
    });
    return NextResponse.json({ success: true, message: "Created", data: created });
  } catch (err) {
    console.error("[/api/admin/destinations] POST", err);
    const msg = err instanceof Error ? err.message : "Invalid payload";
    return NextResponse.json({ success: false, message: msg, data: null }, { status: 400 });
  }
}
