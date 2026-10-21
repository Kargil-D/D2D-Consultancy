import { z } from "zod";

/** `?month=YYYY-MM` for the dashboard's Employee Points leaderboard; omitted = current month. */
export const EmployeePointsQuerySchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Month must be in YYYY-MM format")
    .optional(),
});
