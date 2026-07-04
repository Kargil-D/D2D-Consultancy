import { z } from "zod";

export const DestinationCreateSchema = z.object({
  name: z.string().min(1),
  country: z.string().min(1),
  state: z.string().optional(),
  city: z.string().optional(),
  slug: z.string().optional(),
  shortDescription: z.string().optional().nullable().transform((value) => value ?? ""),
  fullDescription: z.string().optional().nullable().transform((value) => value ?? ""),
  thumbnailImage: z.preprocess((v) => (v === "" ? undefined : v), z.string().url().optional().nullable()),
  bannerImage: z.preprocess((v) => (v === "" ? undefined : v), z.string().url().optional().nullable()),
  isPopular: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
  isDomestic: z.boolean().optional(),
  status: z.enum(["Active", "Inactive"]).optional(),
});

export const DestinationUpdateSchema = DestinationCreateSchema.partial();

export type DestinationCreate = z.infer<typeof DestinationCreateSchema>;
export type DestinationUpdate = z.infer<typeof DestinationUpdateSchema>;
