import { withApiHandler, ok } from "@/lib/apiHandler";
import { ApiError } from "@/lib/apiError";
import { getCurrentUser } from "@/lib/auth";
import { EmployeePointsQuerySchema } from "@/lib/validation/dashboard";
import { currentIstMonth, getMonthlyEmployeePoints } from "@/services/employeePointsService";

export const runtime = "nodejs";

/** Monthly Employee Points leaderboard — visible to every staff member (never Customer accounts).
 * Returns points and booking counts only; booking margins in rupees stay BookingsMaster-only. */
export const GET = withApiHandler("[/api/admin/dashboard/points] GET", async (req) => {
  const user = await getCurrentUser(req);
  if (user.role.name === "Customer") throw new ApiError(403, "Staff access required");

  const { month } = EmployeePointsQuerySchema.parse({ month: new URL(req.url).searchParams.get("month") ?? undefined });
  return ok(await getMonthlyEmployeePoints(month ?? currentIstMonth()));
});
