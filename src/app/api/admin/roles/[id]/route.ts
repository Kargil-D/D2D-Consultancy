import { withApiHandler, ok } from "@/lib/apiHandler";
import { ApiError } from "@/lib/apiError";
import { getCurrentUser } from "@/lib/auth";
import { RoleUpdateSchema } from "@/lib/validation/role";
import { getRole, updateRole, removeRole } from "@/services/roleService";

export const runtime = "nodejs";

interface Ctx {
  params: Promise<{ id: string }>;
}

export const GET = withApiHandler<Ctx>("[/api/admin/roles/[id]] GET", async (req, ctx) => {
  const user = await getCurrentUser(req);
  if (user.role.name !== "Admin") throw new ApiError(403, "Admin access required");

  const { id } = await ctx.params;
  const role = await getRole(id);
  if (!role) throw new ApiError(404, "Role not found");
  return ok(role);
});

export const PUT = withApiHandler<Ctx>("[/api/admin/roles/[id]] PUT", async (req, ctx) => {
  const user = await getCurrentUser(req);
  if (user.role.name !== "Admin") throw new ApiError(403, "Admin access required");

  const { id } = await ctx.params;
  const payload = RoleUpdateSchema.parse(await req.json());
  const updated = await updateRole(id, payload);
  return ok(updated, "Role updated");
});

export const DELETE = withApiHandler<Ctx>("[/api/admin/roles/[id]] DELETE", async (req, ctx) => {
  const user = await getCurrentUser(req);
  if (user.role.name !== "Admin") throw new ApiError(403, "Admin access required");

  const { id } = await ctx.params;
  try {
    await removeRole(id);
  } catch (err) {
    throw new ApiError(400, err instanceof Error ? err.message : "Unable to delete role");
  }
  return ok(true, "Role deleted");
});
