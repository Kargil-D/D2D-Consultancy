import { z } from "zod";

export const ActivityCreateSchema = z.object({
  name: z.string().trim().min(1),
  destinationId: z.string().min(1),
  cityIds: z.array(z.string().min(1)).min(1, "At least one city is required"),
  description: z.string().trim().min(1),
  imageUrl: z.preprocess((v) => (v === "" ? undefined : v), z.string().url().optional().nullable()),
  displayOrder: z.number().int().optional(),
  status: z.enum(["Active", "Inactive"]).optional(),
});

export const ActivityUpdateSchema = ActivityCreateSchema.partial();

export type ActivityCreate = z.infer<typeof ActivityCreateSchema>;
export type ActivityUpdate = z.infer<typeof ActivityUpdateSchema>;
