import { z } from "zod";

export const HotelMasterCreateSchema = z.object({
  name: z.string().trim().min(1),
  destinationId: z.preprocess((v) => (v === "" ? undefined : v), z.string().optional().nullable()),
  images: z.array(z.string()).optional().default([]),
  description: z.string().optional().default(""),
  category: z.string().optional().nullable(),
  roomTypes: z.array(z.string()).optional().default([]),
  mealPlans: z.array(z.string()).optional().default([]),
  amenities: z.array(z.string()).optional().default([]),
  googleMapUrl: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  status: z.enum(["Active", "Inactive"]).optional(),
});

export const HotelMasterUpdateSchema = HotelMasterCreateSchema.partial();

export type HotelMasterCreate = z.infer<typeof HotelMasterCreateSchema>;
export type HotelMasterUpdate = z.infer<typeof HotelMasterUpdateSchema>;
