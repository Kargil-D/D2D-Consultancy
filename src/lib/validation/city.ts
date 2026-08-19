import { z } from "zod";

export const CityCreateSchema = z.object({
  name: z.string().trim().min(1),
  state: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  status: z.enum(["Active", "Inactive"]).optional(),
});

export type CityCreate = z.infer<typeof CityCreateSchema>;
