import { RECENT_ITINERARIES } from "@/data/recentItineraries";
import { getAllItineraries } from "@/services/itineraryService";
import RecentItinerariesRail, {
  type RecentItineraryCard,
} from "./RecentItinerariesRail";

/** Destinations whose itinerary pages are fully published. */
const ACTIVE_DESTINATIONS = new Set(["Maldives", "Thailand"]);

/**
 * Server wrapper that loads the latest itineraries written through the
 * admin module (markdown files in `content/itineraries/`) and merges them
 * with the static seed list. Itineraries whose destination is in
 * {@link ACTIVE_DESTINATIONS} get a live "View Details" link to
 * `/itinerary/[id]`; everything else falls back to a disabled CTA so the
 * rail keeps its variety.
 */
export default function RecentItinerariesSection() {
  const liveItineraries = getAllItineraries();
  const liveIds = new Set(liveItineraries.map((i) => i.id));

  const fromAdmin: RecentItineraryCard[] = liveItineraries.map((i) => ({
    id: i.id,
    title: i.title,
    destination: i.destination ?? i.primaryLocation,
    primaryLocation: i.primaryLocation,
    extraStops: i.extraStops ?? 0,
    audience: i.audience,
    price: i.price,
    nights: i.nights,
    image: i.image,
    bookedBy: i.bookedBy,
    bucket: i.bucket,
    active: ACTIVE_DESTINATIONS.has(i.destination ?? ""),
  }));

  const fromSeed: RecentItineraryCard[] = RECENT_ITINERARIES.filter(
    (i) => !liveIds.has(i.id),
  ).map((i) => {
    const destination = inferDestination(i.title, i.primaryLocation);
    return {
      id: i.id,
      title: i.title,
      destination,
      primaryLocation: i.primaryLocation,
      extraStops: i.extraStops,
      audience: i.audience,
      price: i.price,
      nights: i.nights,
      image: i.image,
      bookedBy: i.bookedBy,
      bucket: i.bucket,
      active: ACTIVE_DESTINATIONS.has(destination),
    };
  });

  const items = [...fromAdmin, ...fromSeed];

  return <RecentItinerariesRail items={items} />;
}

/**
 * Best-effort destination inference for legacy seed entries that don't
 * carry a `destination` field. Falls back to the primary location label.
 */
function inferDestination(title: string, primaryLocation: string): string {
  const hay = `${title} ${primaryLocation}`.toLowerCase();
  const map: Record<string, string> = {
    maldives: "Maldives",
    krabi: "Thailand",
    phuket: "Thailand",
    bangkok: "Thailand",
    pattaya: "Thailand",
    thailand: "Thailand",
    bali: "Bali",
    singapore: "Singapore",
    vietnam: "Vietnam",
    hanoi: "Vietnam",
    danang: "Vietnam",
    "da nang": "Vietnam",
    italy: "Italy",
    rome: "Italy",
    switzerland: "Switzerland",
    zurich: "Switzerland",
    kerala: "Kerala",
    munnar: "Kerala",
    alleppey: "Kerala",
  };
  for (const key of Object.keys(map)) {
    if (hay.includes(key)) return map[key];
  }
  return primaryLocation;
}
