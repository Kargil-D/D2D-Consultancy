import { z } from "zod";

export const CurrencyCreateSchema = z.object({
  code: z.string().trim().toUpperCase().min(2).max(6),
  name: z.string().trim().min(1),
  exchangeRate: z.coerce.number().positive(),
  effectiveFrom: z.string().min(1),
  status: z.enum(["Active", "Inactive"]).optional(),
});

export const CurrencyUpdateSchema = CurrencyCreateSchema.partial();

export type CurrencyCreate = z.infer<typeof CurrencyCreateSchema>;
export type CurrencyUpdate = z.infer<typeof CurrencyUpdateSchema>;
