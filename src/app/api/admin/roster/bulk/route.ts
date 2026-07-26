import { withApiHandler, ok } from "@/lib/apiHandler";
import { ApiError } from "@/lib/apiError";
import { getCurrentUser } from "@/lib/auth";
import { RosterBulkMarkSchema } from "@/lib/validation/roster";
import { bulkMarkRoster } from "@/services/rosterService";

export const runtime = "nodejs";

/** Marks the same status for many employees on one day at once — "Mark all Present today". */
export const POST = withApiHandler("[/api/admin/roster/bulk] POST", async (req) => {
  const user = await getCurrentUser(req);
  if (user.role.name !== "Admin") throw new ApiError(403, "Admin access required");

  const { employeeIds, date, status } = RosterBulkMarkSchema.parse(await req.json());
  const markedBy = `${user.firstName} ${user.lastName}`.trim();
  const result = await bulkMarkRoster(employeeIds, date, status, markedBy);
  return ok(result, `${result.updated} employee(s) marked ${status}`);
});
