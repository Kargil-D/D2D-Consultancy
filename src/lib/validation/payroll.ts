import { z } from "zod";

export const PayslipUpsertSchema = z.object({
  basicSalary: z.coerce.number().int().min(0).default(0),
  hra: z.coerce.number().int().min(0).default(0),
  otherAllowances: z.coerce.number().int().min(0).default(0),
  bonus: z.coerce.number().int().min(0).default(0),
  pfDeduction: z.coerce.number().int().min(0).default(0),
  esiDeduction: z.coerce.number().int().min(0).default(0),
  professionalTax: z.coerce.number().int().min(0).default(0),
  tds: z.coerce.number().int().min(0).default(0),
  otherDeductions: z.coerce.number().int().min(0).default(0),
  pfNumber: z.string().optional().default(""),
  esiNumber: z.string().optional().default(""),
  notes: z.string().optional().default(""),
});

export type PayslipUpsert = z.infer<typeof PayslipUpsertSchema>;
