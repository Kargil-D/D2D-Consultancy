import { z } from "zod";

export const SHEET_TARGETS = ["leads", "bookings"] as const;
export type SheetTarget = (typeof SHEET_TARGETS)[number];

/** Manual "Sync now" from a list page — syncs only that page's sheet. */
export const SheetSyncSchema = z.object({
  target: z.enum(SHEET_TARGETS),
});
