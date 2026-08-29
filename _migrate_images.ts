/**
 * One-off migration: replaces base64 data-URL images already stored in the DB (from the old
 * mock uploadImage()) with real Vercel Blob URLs. Scope: Destination banner/thumbnail, Activity
 * Master imageUrl, Transfer Type imageUrl, Hotel Master images[], and Quotation's four JSON
 * content columns (itineraryDays/hotelOptions/transfers/activities), walked recursively for any
 * embedded base64 image string.
 *
 * Safe by default: reports what it would do without writing anything unless run with --apply.
 *   npx tsx _migrate_images.ts            # dry run, no writes
 *   npx tsx _migrate_images.ts --apply    # actually uploads + updates the DB
 */
import { put } from "@vercel/blob";
import prisma from "./src/lib/prisma";

const APPLY = process.argv.includes("--apply");
const BASE64_PREFIX = "data:image/";

function isBase64Image(s: unknown): s is string {
  return typeof s === "string" && s.startsWith(BASE64_PREFIX);
}

async function uploadBase64(dataUrl: string, label: string): Promise<string> {
  const match = /^data:image\/([a-zA-Z0-9.+-]+);base64,(.+)$/.exec(dataUrl);
  if (!match) throw new Error(`Not a recognized base64 image data URL (${label})`);
  const ext = match[1].split("+")[0] || "bin";
  const buffer = Buffer.from(match[2], "base64");
  const blob = await put(`migrated/${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`, buffer, {
    access: "public",
  });
  return blob.url;
}

/** Recursively walks a JSON value, uploading any base64 image strings found and replacing them
 * in place. Mutates nothing — returns a new value; increments stats.count per image found. */
async function migrateJson(value: unknown, label: string, stats: { count: number }): Promise<unknown> {
  if (isBase64Image(value)) {
    stats.count++;
    return APPLY ? await uploadBase64(value, `${label}-${stats.count}`) : "[would upload]";
  }
  if (Array.isArray(value)) {
    const out: unknown[] = [];
    for (const v of value) out.push(await migrateJson(v, label, stats));
    return out;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = await migrateJson(v, label, stats);
    return out;
  }
  return value;
}

async function main() {
  const report: string[] = [];
  let totalImages = 0;

  console.log(APPLY ? "Running LIVE (will write to the DB and upload to Blob)...\n" : "Running DRY RUN (no writes, no uploads)...\n");

  // 1. Destinations
  const destinations = await prisma.destination.findMany();
  for (const d of destinations) {
    const patch: Record<string, string> = {};
    if (isBase64Image(d.thumbnailImage)) {
      patch.thumbnailImage = APPLY ? await uploadBase64(d.thumbnailImage, `destination-${d.id}-thumb`) : "[would upload]";
    }
    if (isBase64Image(d.bannerImage)) {
      patch.bannerImage = APPLY ? await uploadBase64(d.bannerImage, `destination-${d.id}-banner`) : "[would upload]";
    }
    const n = Object.keys(patch).length;
    if (n === 0) continue;
    totalImages += n;
    report.push(`Destination "${d.name}" (${d.id}): ${n} image(s) [${Object.keys(patch).join(", ")}]`);
    if (APPLY) await prisma.destination.update({ where: { id: d.id }, data: patch });
  }

  // 2. Activity Master
  const activities = await prisma.activity.findMany();
  for (const a of activities) {
    if (!isBase64Image(a.imageUrl)) continue;
    totalImages += 1;
    const url = APPLY ? await uploadBase64(a.imageUrl, `activity-${a.id}`) : "[would upload]";
    report.push(`Activity "${a.name}" (${a.id}): 1 image`);
    if (APPLY) await prisma.activity.update({ where: { id: a.id }, data: { imageUrl: url } });
  }

  // 3. Transfer Types
  const transferTypes = await prisma.transferType.findMany();
  for (const t of transferTypes) {
    if (!isBase64Image(t.imageUrl)) continue;
    totalImages += 1;
    const url = APPLY ? await uploadBase64(t.imageUrl, `transfertype-${t.id}`) : "[would upload]";
    report.push(`TransferType "${t.name}" (${t.id}): 1 image`);
    if (APPLY) await prisma.transferType.update({ where: { id: t.id }, data: { imageUrl: url } });
  }

  // 4. Hotel Master (images is a String[])
  const hotelMasters = await prisma.hotelMaster.findMany();
  for (const h of hotelMasters) {
    const base64Count = h.images.filter(isBase64Image).length;
    if (base64Count === 0) continue;
    totalImages += base64Count;
    const newImages: string[] = [];
    for (let i = 0; i < h.images.length; i++) {
      const img = h.images[i];
      newImages.push(isBase64Image(img) ? (APPLY ? await uploadBase64(img, `hotelmaster-${h.id}-${i}`) : "[would upload]") : img);
    }
    report.push(`HotelMaster "${h.name}" (${h.id}): ${base64Count} image(s)`);
    if (APPLY) await prisma.hotelMaster.update({ where: { id: h.id }, data: { images: newImages } });
  }

  // 5. Quotations — 4 JSON content columns, walked recursively
  const quotations = await prisma.quotation.findMany();
  for (const q of quotations) {
    const stats = { count: 0 };
    const newItineraryDays = await migrateJson(q.itineraryDays, `quotation-${q.id}-itinerary`, stats);
    const newHotelOptions = await migrateJson(q.hotelOptions, `quotation-${q.id}-hotels`, stats);
    const newTransfers = await migrateJson(q.transfers, `quotation-${q.id}-transfers`, stats);
    const newActivities = await migrateJson(q.activities, `quotation-${q.id}-activities`, stats);
    if (stats.count === 0) continue;
    totalImages += stats.count;
    report.push(`Quotation QT-${q.seq.toString().padStart(4, "0")} (${q.id}): ${stats.count} image(s)`);
    if (APPLY) {
      await prisma.quotation.update({
        where: { id: q.id },
        data: {
          itineraryDays: newItineraryDays as any,
          hotelOptions: newHotelOptions as any,
          transfers: newTransfers as any,
          activities: newActivities as any,
        },
      });
    }
  }

  console.log(report.length ? report.join("\n") : "No base64 images found anywhere in scope.");
  console.log(`\n${APPLY ? "Migrated" : "[DRY RUN] Would migrate"} ${totalImages} image(s) across ${report.length} record(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
