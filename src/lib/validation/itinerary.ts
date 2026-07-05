import { z } from "zod";

const ItineraryDayDetailSchema = z.object({
  id: z.string(),
  dayNumber: z.number().int(),
  title: z.string(),
  description: z.string(),
  activities: z.array(z.string()),
  mealsIncluded: z.array(z.string()),
  stayDetails: z.string(),
  transportDetails: z.string(),
  dayImage: z.string().optional(),
  order: z.number().int(),
});

const FaqSchema = z.object({
  question: z.string(),
  answer: z.string(),
});

export const ItineraryCreateSchema = z.object({
  packageId: z.string().min(1),
  title: z.string().optional(),
  overview: z.string().optional(),
  totalDays: z.number().int().optional(),
  days: z.array(ItineraryDayDetailSchema).optional(),
  packageIncludes: z.array(z.string()).optional(),
  packageExcludes: z.array(z.string()).optional(),
  termsAndConditions: z.string().optional(),
  cancellationPolicy: z.string().optional(),
  faqs: z.array(FaqSchema).optional(),
  galleryImages: z.array(z.string()).optional(),
  mapLocation: z.string().optional().nullable(),
  customerNotes: z.string().optional().nullable(),
  ctaButtonText: z.string().optional(),
  ctaRedirect: z.string().optional(),
  status: z.enum(["Active", "Inactive"]).optional(),
  isPublished: z.boolean().optional(),
});

export const ItineraryUpdateSchema = ItineraryCreateSchema.partial();

export type ItineraryCreate = z.infer<typeof ItineraryCreateSchema>;
export type ItineraryUpdate = z.infer<typeof ItineraryUpdateSchema>;
