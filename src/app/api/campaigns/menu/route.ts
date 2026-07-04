import { NextResponse } from "next/server";
import { listCampaigns } from "@/services/campaignService";
import type { PackageMenuColumn } from "@/data/packagesMenu";

const DEFAULT_IMAGE =
  "https://images.pexels.com/photos/1007657/pexels-photo-1007657.jpeg?auto=compress&cs=tinysrgb&w=600";

export async function GET() {
  const result = await listCampaigns({ pageSize: 100, filter: { status: "Active" } });

  const columns: PackageMenuColumn[] = [
    {
      title: "By Destination",
      subtitle: "Most loved trips",
      items: result.items.map((campaign) => ({
        name: campaign.name,
        tagline: campaign.shortDescription || "Hand-picked holiday package",
        href: campaign.viewDetailsRedirect || `/packages/${campaign.slug}`,
        image: campaign.thumbnail || campaign.coverBanner || DEFAULT_IMAGE,
      })),
    },
  ];

  return NextResponse.json({ success: true, message: "OK", data: columns });
}
