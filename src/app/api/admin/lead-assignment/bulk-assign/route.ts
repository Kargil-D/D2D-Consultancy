import { withApiHandler, ok } from "@/lib/apiHandler";
import { ApiError } from "@/lib/apiError";
import { getCurrentUser } from "@/lib/auth";
import { BulkAssignLeadsSchema } from "@/lib/validation/leadAssignment";
import { bulkAssignLeads } from "@/services/leadAssignmentService";

export const runtime = "nodejs";

/** Assigns the same Sales team member to many leads at once — the board's "Bulk Reassign" quick action. */
export const POST = withApiHandler("[/api/admin/lead-assignment/bulk-assign] POST", async (req) => {
  const user = await getCurrentUser(req);
  if (user.role.name !== "Admin") throw new ApiError(403, "Admin access required");

  const { leadIds, toUserId } = BulkAssignLeadsSchema.parse(await req.json());
  const performedBy = `${user.firstName} ${user.lastName}`.trim();
  const result = await bulkAssignLeads(leadIds, toUserId, performedBy);
  return ok(result, `${result.updated} lead(s) assigned`);
});
