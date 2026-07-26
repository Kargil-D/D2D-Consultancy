import { withApiHandler, ok } from "@/lib/apiHandler";
import { ApiError } from "@/lib/apiError";
import { getCurrentUser } from "@/lib/auth";
import { EmployeeAssignRoleSchema } from "@/lib/validation/employee";
import { assignEmployeeRole, getEmployee } from "@/services/employeeService";

export const runtime = "nodejs";

interface Ctx {
  params: Promise<{ id: string }>;
}

/** Sets the Role on the Employee's linked login User — real, enforced access (see getCurrentUser), not a label. */
export const PUT = withApiHandler<Ctx>("[/api/admin/employees/[id]/role] PUT", async (req, ctx) => {
  const user = await getCurrentUser(req);
  if (user.role.name !== "Admin") throw new ApiError(403, "Admin access required");

  const { id } = await ctx.params;
  const target = await getEmployee(id);
  if (target?.userId === user.id) throw new ApiError(403, "You cannot change your own role — ask another Admin.");

  const { roleId } = EmployeeAssignRoleSchema.parse(await req.json());
  const performedBy = `${user.firstName} ${user.lastName}`.trim();

  try {
    const updated = await assignEmployeeRole(id, roleId, performedBy);
    return ok(updated, "Role assigned");
  } catch (err) {
    throw new ApiError(400, err instanceof Error ? err.message : "Unable to assign role");
  }
});
