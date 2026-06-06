import { NextResponse } from "next/server";
import { listDestinations } from "@/services/destinationService";
import type { DestinationMenuColumn } from "@/data/destinationsMenu";

const DEFAULT_IMAGE =
  "https://images.pexels.com/photos/21014/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=600";

export async function GET() {
  const result = await listDestinations({ pageSize: 100, filter: { status: "Active" } });

  const columns: DestinationMenuColumn[] = [
    {
      title: "International",
      subtitle: "Explore the world",
      items: result.items
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
      items: result.items
        .filter((destination) => destination.isDomestic)
        .map((destination) => ({
          name: destination.name,
          tagline: destination.shortDescription || destination.fullDescription || "Explore this destination",
          href: `/plan-trip?destination=${encodeURIComponent(destination.name)}`,
          image: destination.thumbnailImage || destination.bannerImage || DEFAULT_IMAGE,
        })),
    },
  ];

  return NextResponse.json({ success: true, message: "OK", data: columns });
}
