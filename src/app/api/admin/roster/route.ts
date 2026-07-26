import { withApiHandler, ok } from "@/lib/apiHandler";
import { ApiError } from "@/lib/apiError";
import { getCurrentUser } from "@/lib/auth";
import { RosterMarkSchema } from "@/lib/validation/roster";
import { getRosterGrid, markRosterEntry } from "@/services/rosterService";

export const runtime = "nodejs";

export const GET = withApiHandler("[/api/admin/roster] GET", async (req) => {
  const user = await getCurrentUser(req);
  if (user.role.name !== "Admin") throw new ApiError(403, "Admin access required");

  const url = new URL(req.url);
  const now = new Date();
  const year = Number(url.searchParams.get("year") ?? now.getFullYear());
  const month = Number(url.searchParams.get("month") ?? now.getMonth() + 1);
  const department = url.searchParams.get("department") ?? undefined;
  const search = url.searchParams.get("search") ?? undefined;

  const grid = await getRosterGrid(year, month, { department, search });
  return ok(grid);
});

/** Marks (or, with status: null, clears) one employee's attendance for one day. */
export const PUT = withApiHandler("[/api/admin/roster] PUT", async (req) => {
  const user = await getCurrentUser(req);
  if (user.role.name !== "Admin") throw new ApiError(403, "Admin access required");

  const { employeeId, date, status } = RosterMarkSchema.parse(await req.json());
  const markedBy = `${user.firstName} ${user.lastName}`.trim();
  await markRosterEntry(employeeId, date, status, markedBy);
  return ok(true, status ? "Attendance marked" : "Attendance cleared");
});
