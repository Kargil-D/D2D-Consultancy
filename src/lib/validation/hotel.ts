import { z } from "zod";

const HotelStayDetailSchema = z.object({
  id: z.string(),
  name: z.string(),
  images: z.array(z.string()).optional(),
  roomType: z.string(),
  description: z.string(),
});

export const HotelCreateSchema = z.object({
  packageId: z.string().min(1),
  hotels: z.array(HotelStayDetailSchema).optional(),
  status: z.enum(["Active", "Inactive"]).optional(),
});

export const HotelUpdateSchema = HotelCreateSchema.partial();

export type HotelCreate = z.infer<typeof HotelCreateSchema>;
export type HotelUpdate = z.infer<typeof HotelUpdateSchema>;
