import { z } from "zod";

export const AssignLeadSchema = z.object({
  leadId: z.string().min(1),
  toUserId: z.string().min(1),
});

export const BulkAssignLeadsSchema = z.object({
  leadIds: z.array(z.string().min(1)).min(1),
  toUserId: z.string().min(1),
});

export type AssignLeadInput = z.infer<typeof AssignLeadSchema>;
export type BulkAssignLeadsInput = z.infer<typeof BulkAssignLeadsSchema>;
