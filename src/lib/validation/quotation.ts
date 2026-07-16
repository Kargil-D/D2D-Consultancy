import { z } from "zod";

const QuotationComponentEnum = z.enum(["Hotel", "Transfer", "Activity", "Visa", "Insurance", "Flight"]);

const QuotationItemSchema = z.object({
  id: z.string().optional(), // present when editing an existing row
  component: QuotationComponentEnum,
  detail: z.string().optional().default(""),
  qty: z.coerce.number().int().min(1).default(1),
  cost: z.coerce.number().min(0).default(0),
  sortOrder: z.coerce.number().int().default(0),
});

export const QuotationCreateSchema = z.object({
  leadId: z.string().min(1),
  destinationId: z.string().min(1),
  campaignId: z.preprocess((v) => (v === "" ? undefined : v), z.string().optional().nullable()),
  marginPercent: z.coerce.number().min(0).default(0),
  items: z.array(QuotationItemSchema).default([]),
});

export const QuotationUpdateSchema = QuotationCreateSchema.partial();

export type QuotationCreate = z.infer<typeof QuotationCreateSchema>;
export type QuotationUpdate = z.infer<typeof QuotationUpdateSchema>;
export type QuotationItemInput = z.infer<typeof QuotationItemSchema>;
