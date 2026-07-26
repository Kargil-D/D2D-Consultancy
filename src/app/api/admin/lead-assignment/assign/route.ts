import { withApiHandler, ok } from "@/lib/apiHandler";
import { ApiError } from "@/lib/apiError";
import { getCurrentUser } from "@/lib/auth";
import { AssignLeadSchema } from "@/lib/validation/leadAssignment";
import { assignLead } from "@/services/leadAssignmentService";

export const runtime = "nodejs";

/** Assigns (or reassigns) one lead to a Sales team member from the Lead Assignment Board. */
export const POST = withApiHandler("[/api/admin/lead-assignment/assign] POST", async (req) => {
  const user = await getCurrentUser(req);
  if (user.role.name !== "Admin") throw new ApiError(403, "Admin access required");

  const { leadId, toUserId } = AssignLeadSchema.parse(await req.json());
  const performedBy = `${user.firstName} ${user.lastName}`.trim();
  await assignLead(leadId, toUserId, performedBy);
  return ok(true, "Lead assigned");
});
