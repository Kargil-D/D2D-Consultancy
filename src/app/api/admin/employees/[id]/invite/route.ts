import { withApiHandler, ok } from "@/lib/apiHandler";
import { ApiError } from "@/lib/apiError";
import { getCurrentUser } from "@/lib/auth";
import { sendEmployeeInvite } from "@/services/employeeInviteService";

export const runtime = "nodejs";

interface Ctx {
  params: Promise<{ id: string }>;
}

/** Emails a one-time "set your own password" link to the employee — Admin never sets or sees a password. */
export const POST = withApiHandler<Ctx>("[/api/admin/employees/[id]/invite] POST", async (req, ctx) => {
  const user = await getCurrentUser(req);
  if (user.role.name !== "Admin") throw new ApiError(403, "Admin access required");

  const { id } = await ctx.params;
  const performedBy = `${user.firstName} ${user.lastName}`.trim();
  const siteUrl = new URL(req.url).origin;

  try {
    const result = await sendEmployeeInvite(id, performedBy, siteUrl);
    return ok(result, `Invite sent to ${result.email}`);
  } catch (err) {
    throw new ApiError(400, err instanceof Error ? err.message : "Unable to send invite");
  }
});
