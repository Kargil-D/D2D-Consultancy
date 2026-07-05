import { z } from "zod";

const TransferStopDetailSchema = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(),
  transferTypeId: z.string().optional(),
});

export const TransferCreateSchema = z.object({
  packageId: z.string().min(1),
  transfers: z.array(TransferStopDetailSchema).optional(),
  status: z.enum(["Active", "Inactive"]).optional(),
});

export const TransferUpdateSchema = TransferCreateSchema.partial();

export type TransferCreate = z.infer<typeof TransferCreateSchema>;
export type TransferUpdate = z.infer<typeof TransferUpdateSchema>;

export const TransferTypeCreateSchema = z.object({
  name: z.string().min(1),
  status: z.enum(["Active", "Inactive"]).optional(),
});

export const TransferTypeUpdateSchema = TransferTypeCreateSchema.partial();

export type TransferTypeCreate = z.infer<typeof TransferTypeCreateSchema>;
export type TransferTypeUpdate = z.infer<typeof TransferTypeUpdateSchema>;
