import { withApiHandler, ok } from "@/lib/apiHandler";
import { ApiError } from "@/lib/apiError";
import { getCurrentUser } from "@/lib/auth";
import { getEmployeeByUserId } from "@/services/employeeService";
import { getMyRoster } from "@/services/rosterService";

export const runtime = "nodejs";

/** Self-view for "My Roster" — any staff member (not just Admin), never someone else's. */
export const GET = withApiHandler("[/api/roster/me] GET", async (req) => {
  const user = await getCurrentUser(req);
  if (user.role.name === "Customer") throw new ApiError(403, "Staff access required");

  const employee = await getEmployeeByUserId(user.id);
  if (!employee) throw new ApiError(404, "No employee profile is linked to your login account");

  const url = new URL(req.url);
  const now = new Date();
  const year = Number(url.searchParams.get("year") ?? now.getFullYear());
  const month = Number(url.searchParams.get("month") ?? now.getMonth() + 1);

  const roster = await getMyRoster(employee.id, year, month);
  return ok(roster);
});
