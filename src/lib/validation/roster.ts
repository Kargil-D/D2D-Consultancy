import { z } from "zod";

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

export const RosterMarkSchema = z.object({
  employeeId: z.string().min(1),
  date: dateStr,
  status: z.enum(["Present", "Absent"]).nullable(),
});

export const RosterBulkMarkSchema = z.object({
  employeeIds: z.array(z.string().min(1)).min(1),
  date: dateStr,
  status: z.enum(["Present", "Absent"]),
});

export const RosterMarkSelfSchema = z.object({
  date: dateStr,
  status: z.enum(["Present", "Absent"]).nullable(),
});

export type RosterMarkInput = z.infer<typeof RosterMarkSchema>;
export type RosterBulkMarkInput = z.infer<typeof RosterBulkMarkSchema>;
export type RosterMarkSelfInput = z.infer<typeof RosterMarkSelfSchema>;
