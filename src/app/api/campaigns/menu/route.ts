import { NextResponse } from "next/server";
import { listCampaignSummaries } from "@/services/campaignService";
import type { PackageMenuColumn } from "@/data/packagesMenu";

const DEFAULT_IMAGE =
  "https://images.pexels.com/photos/1007657/pexels-photo-1007657.jpeg?auto=compress&cs=tinysrgb&w=600";

/** Cached at the CDN for an hour (stale served up to a day while revalidating) — the menu
 * changes only when an admin edits campaigns, so most page views never touch the database. */
const CACHE_CONTROL = "public, s-maxage=3600, stale-while-revalidate=86400";

export async function GET() {
  const items = await listCampaignSummaries({ pageSize: 100, filter: { status: "Active" } });

  const columns: PackageMenuColumn[] = [
    {
      title: "By Destination",
      subtitle: "Most loved trips",
      items: items.map((campaign) => ({
        name: campaign.name,
        tagline: campaign.shortDescription || "Hand-picked holiday package",
        href: campaign.viewDetailsRedirect || `/packages/${campaign.slug}`,
        image: campaign.thumbnail || campaign.coverBanner || DEFAULT_IMAGE,
      })),
    },
  ];

  return NextResponse.json(
    { success: true, message: "OK", data: columns },
    { headers: { "Cache-Control": CACHE_CONTROL } },
  );
}
