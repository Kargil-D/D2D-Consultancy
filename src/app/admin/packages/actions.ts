"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  writeItineraryFile,
  type ItineraryFrontmatter,
  type MealPlan,
  type ItineraryAudience,
  type PriceBucket,
} from "@/services/itineraryService";

/** Slugify helper used when admin doesn't supply an ID. */
function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function num(v: FormDataEntryValue | null, def = 0): number {
  const n = Number((v ?? "").toString().trim());
  return Number.isFinite(n) ? n : def;
}

function str(v: FormDataEntryValue | null, def = ""): string {
  return (v ?? def).toString().trim();
}

/**
 * Save an itinerary from the admin form to a markdown file. Runs as a
 * Server Action ï¿½ fully server-side, never bundled to the client.
 */
export async function saveItineraryAction(formData: FormData) {
  const title = str(formData.get("title"));
  if (!title) throw new Error("Title is required");

  const id = str(formData.get("id")) || slugify(title);
  const destination = str(formData.get("destination"), "Maldives");

  // Parse repeating arrays from JSON strings the client serialises.
  const hotelsJson = str(formData.get("hotels"), "[]");
  const activitiesJson = str(formData.get("activities"), "[]");
  const transfersJson = str(formData.get("transfers"), "[]");
  const featuresJson = str(formData.get("features"), "[]");

  let hotels: ItineraryFrontmatter["hotels"];
  let activities: ItineraryFrontmatter["activities"];
  let transfers: ItineraryFrontmatter["transfers"];
  let features: ItineraryFrontmatter["features"];
  try {
    hotels = JSON.parse(hotelsJson);
    activities = JSON.parse(activitiesJson);
    transfers = JSON.parse(transfersJson);
    features = JSON.parse(featuresJson);
  } catch {
    throw new Error("Invalid form data ï¿½ could not parse list fields.");
  }

  // Coerce hotel meal plan to allowed enum
  hotels = (hotels ?? []).map((h) => ({
    ...h,
    nights: Number(h.nights) || 1,
    mealPlan: (["BB", "HB", "FB", "AI"].includes(String(h.mealPlan))
      ? h.mealPlan
      : "BB") as MealPlan,
  }));

  const nights = num(formData.get("nights"), 1);
  const price = num(formData.get("price"), 0);
  const rating = num(formData.get("rating"), 0) || undefined;
  const reviews = num(formData.get("reviews"), 0) || undefined;
  const totalPackageCost = num(formData.get("totalPackageCost"), 0);
  const gstPct = num(formData.get("gstPct"), 5);

  const audience = (str(formData.get("audience"), "COUPLE") as ItineraryAudience);
  const bucket = (str(formData.get("bucket"), "Luxury") as PriceBucket);

  const frontmatter: ItineraryFrontmatter = {
    id,
    title,
    destination,
    primaryLocation: str(formData.get("primaryLocation"), destination),
    extraStops: num(formData.get("extraStops"), 0),
    audience,
    price,
    nights,
    rating,
    reviews,
    tagline: str(formData.get("tagline")) || undefined,
    image: str(formData.get("image")),
    bookedBy: {
      name: str(formData.get("bookedByName"), "Guest"),
      city: str(formData.get("bookedByCity"), "ï¿½"),
      ago: str(formData.get("bookedByAgo"), "just now"),
    },
    bucket,
    features: features?.length ? features : undefined,
    hotels: hotels?.length ? hotels : undefined,
    activities: activities?.length ? activities : undefined,
    transfers: transfers?.length ? transfers : undefined,
    pricing: totalPackageCost
      ? {
          totalPackageCost,
          gstPct,
          totalAmount:
            num(formData.get("totalAmount"), 0) ||
            Math.round(totalPackageCost * (1 + gstPct / 100)),
        }
      : undefined,
  };

  const body = str(formData.get("body"), `# ${title}\n\n## Day 1 - Arrival\n- **10:00 AM** Arrival\n\n## Inclusions\n- TBD\n\n## Exclusions\n- TBD`);

  writeItineraryFile(frontmatter, body);

  // Refresh both the admin listing and the customer page.
  revalidatePath("/admin/packages");
  revalidatePath(`/itinerary/${id}`);
  redirect(`/admin/packages?saved=${id}`);
}
