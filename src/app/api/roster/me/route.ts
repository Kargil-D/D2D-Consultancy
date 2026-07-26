import type { NextRequest } from "next/server";
import { withApiHandler, ok } from "@/lib/apiHandler";
import { ApiError } from "@/lib/apiError";
import { getCurrentUser } from "@/lib/auth";
import { getEmployeeByUserId } from "@/services/employeeService";
import { getMyRoster, markRosterEntry } from "@/services/rosterService";
import { RosterMarkSelfSchema } from "@/lib/validation/roster";

export const runtime = "nodejs";

async function resolveOwnEmployee(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (user.role.name === "Customer") throw new ApiError(403, "Staff access required");

  const employee = await getEmployeeByUserId(user.id);
  if (!employee) throw new ApiError(404, "No employee profile is linked to your login account");
  return { user, employee };
}

/** Self-view for "My Roster" — any staff member (not just Admin), never someone else's. */
export const GET = withApiHandler("[/api/roster/me] GET", async (req) => {
  const { employee } = await resolveOwnEmployee(req);

  const url = new URL(req.url);
  const now = new Date();
  const year = Number(url.searchParams.get("year") ?? now.getFullYear());
  const month = Number(url.searchParams.get("month") ?? now.getMonth() + 1);

  const roster = await getMyRoster(employee.id, year, month);
  return ok(roster);
});

/** Self-mark: an employee sets their own Present/Absent (status: null clears it back to unmarked). The employee is always resolved from the session — this can never touch anyone else's roster. */
export const PUT = withApiHandler("[/api/roster/me] PUT", async (req) => {
  const { user, employee } = await resolveOwnEmployee(req);

  const { date, status } = RosterMarkSelfSchema.parse(await req.json());
  const markedBy = `${user.firstName} ${user.lastName}`.trim() + " (self)";
  await markRosterEntry(employee.id, date, status, markedBy);
  return ok(true, status ? "Attendance marked" : "Attendance cleared");
});
