/**
 * Legacy inline-image migration for quotation content.
 *
 * Older master records (Activity Master imageUrl, Hotel Master images, itinerary day images)
 * stored pictures as base64 `data:` URIs. Building a quotation copies those strings into its
 * itineraryDays/hotelOptions/transfers/activities JSON, so a handful of activities can push a
 * save past Vercel's ~4.5 MB request-body limit — the server then rejects every save with 413.
 *
 * Before a save, `migrateInlineImages` uploads each embedded image to Blob storage (compressed
 * client-side first) and swaps the data URI for the returned URL. Anything that fails to
 * upload is left untouched, so the worst case is the old behaviour — never data loss.
 */
import { uploadImage } from "@/lib/adminApi";
import { compressImage } from "@/components/admin/ui/ImageUpload";
import type {
  QuotationActivityItem,
  QuotationHotelOptionGroup,
  QuotationItineraryDay,
  QuotationTransferItem,
} from "@/types/admin";

const DATA_URI = /^data:(image\/[a-z0-9+.-]+);base64,(.*)$/i;

function dataUriToFile(uri: string, name: string): File | null {
  const match = DATA_URI.exec(uri);
  if (!match) return null;
  try {
    const [, mime, b64] = match;
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const ext = (mime.split("/")[1] ?? "png").replace("jpeg", "jpg");
    return new File([bytes], `${name}.${ext}`, { type: mime });
  } catch {
    return null;
  }
}

async function toUrl(uri: string, label: string): Promise<string> {
  const file = dataUriToFile(uri, label);
  if (!file) return uri;
  try {
    const res = await uploadImage(await compressImage(file));
    return res.success && res.data.url ? res.data.url : uri;
  } catch {
    return uri;
  }
}

async function migrateList(images: string[], label: string): Promise<{ changed: boolean; images: string[] }> {
  if (!images.some((u) => DATA_URI.test(u))) return { changed: false, images };
  const next = await Promise.all(images.map((u, i) => (DATA_URI.test(u) ? toUrl(u, `${label}-${i}`) : Promise.resolve(u))));
  return { changed: next.some((u, i) => u !== images[i]), images: next };
}

export interface QuotationImageSections {
  itineraryDays: QuotationItineraryDay[];
  hotelOptions: QuotationHotelOptionGroup[];
  transfers: QuotationTransferItem[];
  activities: QuotationActivityItem[];
}

/** True when any images array in the sections still carries a base64 data URI. */
export function hasInlineImages(sections: QuotationImageSections): boolean {
  return (
    sections.itineraryDays.some((d) => d.images.some((u) => DATA_URI.test(u))) ||
    sections.hotelOptions.some((g) => g.hotels.some((h) => h.images.some((u) => DATA_URI.test(u)))) ||
    sections.transfers.some((t) => t.images.some((u) => DATA_URI.test(u))) ||
    sections.activities.some((a) => a.images.some((u) => DATA_URI.test(u)))
  );
}

/** Uploads every embedded base64 image and returns the sections with URLs swapped in.
 * `changed` is false when there was nothing to migrate (the common case — one cheap regex scan). */
export async function migrateInlineImages(sections: QuotationImageSections): Promise<QuotationImageSections & { changed: boolean }> {
  if (!hasInlineImages(sections)) return { ...sections, changed: false };

  let changed = false;

  const itineraryDays = await Promise.all(
    sections.itineraryDays.map(async (d) => {
      const res = await migrateList(d.images, `day-${d.dayNumber}`);
      if (!res.changed) return d;
      changed = true;
      return { ...d, images: res.images };
    }),
  );

  const hotelOptions = await Promise.all(
    sections.hotelOptions.map(async (g) => {
      const hotels = await Promise.all(
        g.hotels.map(async (h) => {
          const res = await migrateList(h.images, `hotel-${h.id}`);
          if (!res.changed) return h;
          changed = true;
          return { ...h, images: res.images };
        }),
      );
      return hotels.some((h, i) => h !== g.hotels[i]) ? { ...g, hotels } : g;
    }),
  );

  const transfers = await Promise.all(
    sections.transfers.map(async (t) => {
      const res = await migrateList(t.images, `transfer-${t.id}`);
      if (!res.changed) return t;
      changed = true;
      return { ...t, images: res.images };
    }),
  );

  const activities = await Promise.all(
    sections.activities.map(async (a) => {
      const res = await migrateList(a.images, `activity-${a.id}`);
      if (!res.changed) return a;
      changed = true;
      return { ...a, images: res.images };
    }),
  );

  return { itineraryDays, hotelOptions, transfers, activities, changed };
}
