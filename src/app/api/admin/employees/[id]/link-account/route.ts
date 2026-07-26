import { withApiHandler, ok } from "@/lib/apiHandler";
import { ApiError } from "@/lib/apiError";
import { getCurrentUser } from "@/lib/auth";
import { EmployeeLinkAccountSchema } from "@/lib/validation/employee";
import { linkEmployeeToUser, unlinkEmployeeUser, getEmployee } from "@/services/employeeService";

export const runtime = "nodejs";

interface Ctx {
  params: Promise<{ id: string }>;
}

/** Links an Employee HR record to an existing login User by email. Does not create new User accounts — that's a separate invite/registration flow not built yet. */
export const POST = withApiHandler<Ctx>("[/api/admin/employees/[id]/link-account] POST", async (req, ctx) => {
  const user = await getCurrentUser(req);
  if (user.role.name !== "Admin") throw new ApiError(403, "Admin access required");

  const { id } = await ctx.params;
  const { email } = EmployeeLinkAccountSchema.parse(await req.json());
  const performedBy = `${user.firstName} ${user.lastName}`.trim();

  try {
    const updated = await linkEmployeeToUser(id, email, performedBy);
    return ok(updated, "Login account linked");
  } catch (err) {
    throw new ApiError(400, err instanceof Error ? err.message : "Unable to link account");
  }
});

export const DELETE = withApiHandler<Ctx>("[/api/admin/employees/[id]/link-account] DELETE", async (req, ctx) => {
  const user = await getCurrentUser(req);
  if (user.role.name !== "Admin") throw new ApiError(403, "Admin access required");

  const { id } = await ctx.params;
  const target = await getEmployee(id);
  if (target?.userId === user.id) throw new ApiError(403, "You cannot unlink your own login account — ask another Admin.");

  const performedBy = `${user.firstName} ${user.lastName}`.trim();
  const updated = await unlinkEmployeeUser(id, performedBy);
  return ok(updated, "Login account unlinked");
});
