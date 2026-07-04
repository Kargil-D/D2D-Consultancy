import { z } from "zod";

export const CampaignCreateSchema = z.object({
  name: z.string().min(1),
  destinationId: z.string().min(1),
  packageType: z.string().optional(),
  days: z.number().int().optional(),
  nights: z.number().int().optional(),
  startingPrice: z.number().optional(),
  offerPrice: z.number().optional().nullable(),
  thumbnail: z.string().optional().nullable(),
  coverBanner: z.string().optional().nullable(),
  shortDescription: z.string().optional(),
  highlights: z.array(z.string()).optional(),
  inclusions: z.array(z.string()).optional(),
  exclusions: z.array(z.string()).optional(),
  bestTimeToVisit: z.string().optional().nullable(),
  travelTypes: z.array(z.enum(["Family", "Honeymoon", "Adventure", "Group", "Solo"])).optional(),
  isFeatured: z.boolean().optional(),
  isRecentlyViewed: z.boolean().optional(),
  isHeroCampaign: z.boolean().optional(),
  viewDetailsRedirect: z.string().optional().nullable(),
  slug: z.string().optional(),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
  status: z.enum(["Active", "Inactive"]).optional(),
  gallery: z.array(z.string()).optional(),
});

export const CampaignUpdateSchema = CampaignCreateSchema.partial();

export type CampaignCreate = z.infer<typeof CampaignCreateSchema>;
export type CampaignUpdate = z.infer<typeof CampaignUpdateSchema>;
