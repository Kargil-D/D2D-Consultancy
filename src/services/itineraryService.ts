import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

/* -------------------------------------------------------------------------- */
/*  Domain types                                                              */
/* -------------------------------------------------------------------------- */

export type ItineraryAudience = "FAMILY" | "COUPLE" | "FRIENDS" | "SOLO";
export type PriceBucket =
  | "Under 50K"
  | "50K to 1.5L"
  | "1.5L to 2.5L"
  | "Luxury";

export type MealPlan = "BB" | "HB" | "FB" | "AI";

export interface ItineraryActivity {
  time: string;
  activity: string;
}

export interface ItineraryDay {
  label: string;
  title: string;
  activities: ItineraryActivity[];
  /** Optional inline image gallery for this day (up to 4 photos). */
  images?: string[];
  /** Optional tags shown under the day card e.g. "Dinner", "Transfer". */
  tags?: string[];
}

export interface HotelAmenity {
  label: string;
  icon?: string; // lucide icon name
}

export interface HotelOption {
  name: string;
  area?: string;
  city?: string;
  roomType: string;
  nights: number;
  mealPlan: MealPlan;
  /** Hero image (used as gallery cover). */
  image?: string;
  /** Optional additional images for the hotel gallery. */
  images?: string[];
  /** Hotel star rating (1-5). */
  starRating?: number;
  /** Property category tag e.g. "Beachfront Resort", "5-Star Hotel". */
  category?: string;
  /** Short tagline / headline e.g. "Secure & Easy Booking". */
  tagline?: string;
  /** Amenity chips shown on the hotel card. */
  amenities?: HotelAmenity[];
  mapUrl?: string;
}

export interface ActivityOption {
  title: string;
  icon?: string; // lucide icon name
}

export interface TransferOption {
  from: string;
  to: string;
  type: string; // Speedboat, Cab, Seaplane, etc.
  icon?: string;
}

export interface FeatureBadge {
  label: string; // e.g. "4 Nights / 5 Days"
  icon?: string;
}

/** Optional pricing breakdown for the Price Break down card. */
export interface PricingBreakdown {
  totalPackageCost: number;
  gstPct: number;
  /** Optional planning platform fee added before GST. */
  platformFee?: number;
  /** Final amount = subtotal + GST (auto-calculated if not provided). */
  totalAmount?: number;
}

export interface ItineraryFrontmatter {
  id: string;
  title: string;
  destination: string; // "Maldives"
  primaryLocation: string; // "Maldives" or "Krabi (3N)"
  extraStops: number;
  audience: ItineraryAudience;
  /** Per-person price in INR. */
  price: number;
  nights: number;
  /** Hero / card image. */
  image: string;
  /** Optional rating shown beside the title (e.g. 4.8). */
  rating?: number;
  reviews?: number;
  /** Short tag-line shown over the hero. */
  tagline?: string;
  bookedBy: { name: string; city: string; ago: string };
  bucket: PriceBucket;
  features?: FeatureBadge[];
  hotels?: HotelOption[];
  activities?: ActivityOption[];
  transfers?: TransferOption[];
  pricing?: PricingBreakdown;
}

export interface ItineraryContent extends ItineraryFrontmatter {
  days: ItineraryDay[];
  inclusions: string[];
  exclusions: string[];
  bodyMarkdown: string;
}

const CONTENT_DIR = path.join(process.cwd(), "content", "itineraries");

/* -------------------------------------------------------------------------- */
/*  Markdown body parser                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Parse the markdown body into structured days + inclusions/exclusions.
 *
 * Convention:
 *   ## Day N - <Title>
 *     - **HH:MM AM/PM** Activity description
 *   ## Inclusions
 *     - bullet
 *   ## Exclusions
 *     - bullet
 *
 * Rich data (hotels, transfers, activities, pricing) is provided in
 * frontmatter to keep markdown bodies focused on day-by-day prose.
 */
function parseBody(body: string): {
  days: ItineraryDay[];
  inclusions: string[];
  exclusions: string[];
} {
  const lines = body.split(/\r?\n/);
  const days: ItineraryDay[] = [];
  const inclusions: string[] = [];
  const exclusions: string[] = [];

  type Section = "day" | "inclusions" | "exclusions" | "none";
  let section: Section = "none";
  let currentDay: ItineraryDay | null = null;

  // Accept hyphen, em-dash, en-dash as separators.
  const dayHeading = /^##\s+Day\s+(\d+)\s*[-\u2013\u2014]\s*(.+?)\s*$/i;
  const inclusionHeading = /^##\s+Inclusions?\s*$/i;
  const exclusionHeading = /^##\s+Exclusions?\s*$/i;
  const otherHeading = /^##\s+/;
  const bulletWithTime = /^\s*[-*]\s+\*\*([^*]+)\*\*\s*(.+?)\s*$/;
  const plainBullet = /^\s*[-*]\s+(.+?)\s*$/;

  const flushDay = () => {
    if (currentDay) days.push(currentDay);
    currentDay = null;
  };

  for (const raw of lines) {
    const dayMatch = raw.match(dayHeading);
    if (dayMatch) {
      flushDay();
      currentDay = {
        label: `Day ${dayMatch[1]}`,
        title: dayMatch[2].trim(),
        activities: [],
      };
      section = "day";
      continue;
    }

    if (inclusionHeading.test(raw)) {
      flushDay();
      section = "inclusions";
      continue;
    }
    if (exclusionHeading.test(raw)) {
      flushDay();
      section = "exclusions";
      continue;
    }
    if (otherHeading.test(raw)) {
      flushDay();
      section = "none";
      continue;
    }

    if (section === "day" && currentDay) {
      const m = raw.match(bulletWithTime);
      if (m) {
        currentDay.activities.push({
          time: m[1].trim(),
          activity: m[2].trim(),
        });
        continue;
      }
      const pb = raw.match(plainBullet);
      if (pb) {
        currentDay.activities.push({ time: "All day", activity: pb[1].trim() });
      }
    } else if (section === "inclusions") {
      const m = raw.match(plainBullet);
      if (m) inclusions.push(m[1].trim());
    } else if (section === "exclusions") {
      const m = raw.match(plainBullet);
      if (m) exclusions.push(m[1].trim());
    }
  }

  flushDay();
  return { days, inclusions, exclusions };
}

/* -------------------------------------------------------------------------- */
/*  Cache + loaders                                                            */
/* -------------------------------------------------------------------------- */

let cache: ItineraryContent[] | null = null;

function loadAll(): ItineraryContent[] {
  if (cache) return cache;
  if (!fs.existsSync(CONTENT_DIR)) {
    cache = [];
    return cache;
  }
  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".md"));
  cache = files.map((file) => {
    const fullPath = path.join(CONTENT_DIR, file);
    const raw = fs.readFileSync(fullPath, "utf-8");
    const { data, content } = matter(raw);
    const fm = data as ItineraryFrontmatter;
    const parsed = parseBody(content);
    return {
      ...fm,
      ...parsed,
      bodyMarkdown: content,
    };
  });
  return cache;
}

/** Force re-read on next access ï¿½ used by the admin save flow. */
export function invalidateItineraryCache(): void {
  cache = null;
}

export function getAllItineraries(): ItineraryContent[] {
  return loadAll();
}

export function getItineraryById(id: string): ItineraryContent | undefined {
  return loadAll().find((i) => i.id === id);
}

export function getAllItineraryIds(): string[] {
  return loadAll().map((i) => i.id);
}

/* -------------------------------------------------------------------------- */
/*  Admin writer                                                               */
/* -------------------------------------------------------------------------- */

/** Where saved files land ï¿½ kept as a constant so the admin route can use it too. */
export function getItineraryFilePath(id: string): string {
  return path.join(CONTENT_DIR, `${id}.md`);
}

/**
 * Persist an itinerary back to disk. Used by the admin server action.
 * Both `frontmatter` and `bodyMarkdown` are required; the file is
 * rewritten atomically.
 */
export function writeItineraryFile(
  frontmatter: ItineraryFrontmatter,
  bodyMarkdown: string,
): string {
  if (!fs.existsSync(CONTENT_DIR)) {
    fs.mkdirSync(CONTENT_DIR, { recursive: true });
  }
  const file = matter.stringify(bodyMarkdown.trim() + "\n", frontmatter);
  const dest = getItineraryFilePath(frontmatter.id);
  fs.writeFileSync(dest, file, "utf-8");
  invalidateItineraryCache();
  return dest;
}
