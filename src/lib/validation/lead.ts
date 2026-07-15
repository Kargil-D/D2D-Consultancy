import { z } from "zod";

const LeadSourceEnum = z.enum([
  "Website",
  "MetaAds",
  "GoogleAds",
  "SEO",
  "WhatsApp",
  "Referral",
  "Manual",
]);

const LeadStatusEnum = z.enum([
  "New",
  "Contacted",
  "FollowUp",
  "QuotationSent",
  "PaymentPending",
  "Won",
  "Lost",
]);

export const LeadCreateSchema = z.object({
  customerName: z.string().min(1),
  mobile: z.string().min(1),
  email: z.preprocess((v) => (v === "" ? undefined : v), z.string().email().optional().nullable()),
  destinationId: z.string().min(1),
  travelDate: z.preprocess((v) => (v === "" ? undefined : v), z.coerce.date().optional().nullable()),
  source: LeadSourceEnum,
  adults: z.preprocess((v) => (v === "" ? undefined : v), z.coerce.number().int().optional().nullable()),
  children: z.preprocess((v) => (v === "" ? undefined : v), z.coerce.number().int().optional().nullable()),
  assignedToId: z.preprocess((v) => (v === "" ? undefined : v), z.string().optional().nullable()),
  remarks: z.string().optional().nullable(),
});

export const LeadUpdateSchema = LeadCreateSchema.partial();

export const LeadStatusUpdateSchema = z.object({
  status: LeadStatusEnum,
});

export type LeadCreate = z.infer<typeof LeadCreateSchema>;
export type LeadUpdate = z.infer<typeof LeadUpdateSchema>;
export type LeadStatusUpdate = z.infer<typeof LeadStatusUpdateSchema>;
