import { withApiHandler, ok } from "@/lib/apiHandler";
import { ApiError } from "@/lib/apiError";
import { getCurrentUser } from "@/lib/auth";
import { toggleRoleStatus } from "@/services/roleService";

export const runtime = "nodejs";

interface Ctx {
  params: Promise<{ id: string }>;
}

/** Setting a role Inactive blocks login for every User holding it (see getCurrentUser / the login route / rotateRefreshToken) — not cosmetic. */
export const POST = withApiHandler<Ctx>("[/api/admin/roles/[id]/toggle-status] POST", async (req, ctx) => {
  const user = await getCurrentUser(req);
  if (user.role.name !== "Admin") throw new ApiError(403, "Admin access required");

  const { id } = await ctx.params;
  const updated = await toggleRoleStatus(id);
  if (!updated) throw new ApiError(404, "Role not found");
  return ok(updated);
});
