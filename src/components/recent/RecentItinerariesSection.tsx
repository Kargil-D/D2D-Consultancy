import { listCampaigns, type CampaignWithDestination } from "@/services/campaignService";
import RecentItinerariesRail, {
  type RecentItineraryCard,
  type ItineraryAudience,
  type PriceBucket,
} from "./RecentItinerariesRail";

const DEFAULT_IMAGE =
  "https://images.pexels.com/photos/1007657/pexels-photo-1007657.jpeg?auto=compress&cs=tinysrgb&w=600";

const AUDIENCE_BY_TRAVEL_TYPE: Record<string, ItineraryAudience> = {
  Family: "FAMILY",
  Honeymoon: "COUPLE",
  Adventure: "FRIENDS",
  Group: "FRIENDS",
  Solo: "SOLO",
};

function priceBucket(price: number): PriceBucket {
  if (price < 50000) return "Under 50K";
  if (price < 150000) return "50K to 1.5L";
  if (price < 250000) return "1.5L to 2.5L";
  return "Luxury";
}

function campaignToCard(c: CampaignWithDestination): RecentItineraryCard {
  const price = c.offerPrice || c.startingPrice;
  return {
    id: c.id,
    title: c.name,
    destination: c.destination.name,
    primaryLocation: `${c.destination.name} (${c.nights}N)`,
    extraStops: 0,
    audience: AUDIENCE_BY_TRAVEL_TYPE[c.travelTypes[0]] ?? "FAMILY",
    price,
    nights: c.nights,
    image: c.thumbnail || c.coverBanner || DEFAULT_IMAGE,
    bookedBy: {
      name: c.bookedByName || "A traveler",
      city: c.bookedByCity || c.destination.name,
      ago: c.bookedByAgo || "recently",
    },
    bucket: priceBucket(price),
    active: true,
    detailsUrl: `/campaigns/${c.slug}`,
  };
}

/**
 * Server wrapper that loads Campaigns flagged `isRecentlyViewed` from
 * Postgres (managed at `/admin/packages-master`) and renders them in the
 * Recently Booked rail. No static/markdown content — this section shows
 * only real campaign records.
 */
export default async function RecentItinerariesSection() {
  let items: RecentItineraryCard[] = [];
  try {
    const dbCampaigns = await listCampaigns({
      pageSize: 20,
      filter: { isRecentlyViewed: true, status: "Active" },
    });
    items = dbCampaigns.items.map(campaignToCard);
  } catch (error) {
    console.error("[RecentItinerariesSection] Failed to load campaigns", error);
  }

  return <RecentItinerariesRail items={items} />;
}
