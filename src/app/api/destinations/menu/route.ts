import { NextResponse } from "next/server";
import { listDestinationMenuEntries } from "@/services/destinationService";
import type { DestinationMenuColumn } from "@/data/destinationsMenu";

const DEFAULT_IMAGE =
  "https://images.pexels.com/photos/21014/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=600";

/** Cached at the CDN for an hour (stale served up to a day while revalidating) — the menu
 * changes only when an admin edits destinations, so most page views never touch the database. */
const CACHE_CONTROL = "public, s-maxage=3600, stale-while-revalidate=86400";

export async function GET() {
  const items = await listDestinationMenuEntries();

  const columns: DestinationMenuColumn[] = [
    {
      title: "International",
      subtitle: "Explore the world",
      items: items
        .filter((destination) => !destination.isDomestic)
        .map((destination) => ({
          name: destination.name,
          tagline: destination.shortDescription || destination.fullDescription || "Explore this destination",
          href: `/plan-trip?destination=${encodeURIComponent(destination.name)}`,
          image: destination.thumbnailImage || destination.bannerImage || DEFAULT_IMAGE,
        })),
    },
    {
      title: "Domestic",
      subtitle: "Discover incredible India",
      items: items
        .filter((destination) => destination.isDomestic)
        .map((destination) => ({
          name: destination.name,
          tagline: destination.shortDescription || destination.fullDescription || "Explore this destination",
          href: `/plan-trip?destination=${encodeURIComponent(destination.name)}`,
          image: destination.thumbnailImage || destination.bannerImage || DEFAULT_IMAGE,
        })),
    },
  ];

  return NextResponse.json(
    { success: true, message: "OK", data: columns },
    { headers: { "Cache-Control": CACHE_CONTROL } },
  );
}
