import { withApiHandler, ok } from "@/lib/apiHandler";
import { ApiError } from "@/lib/apiError";
import { getCurrentUser } from "@/lib/auth";
import { EmployeeUpdateSchema } from "@/lib/validation/employee";
import { getEmployee, updateEmployee, removeEmployee } from "@/services/employeeService";

export const runtime = "nodejs";

interface Ctx {
  params: Promise<{ id: string }>;
}

export const GET = withApiHandler<Ctx>("[/api/admin/employees/[id]] GET", async (_req, ctx) => {
  const { id } = await ctx.params;
  const employee = await getEmployee(id);
  if (!employee) throw new ApiError(404, "Employee not found");
  return ok(employee);
});

export const PUT = withApiHandler<Ctx>("[/api/admin/employees/[id]] PUT", async (req, ctx) => {
  const user = await getCurrentUser(req);
  if (user.role.name !== "Admin") throw new ApiError(403, "Admin access required");

  const { id } = await ctx.params;
  const payload = EmployeeUpdateSchema.parse(await req.json());
  const updatedBy = `${user.firstName} ${user.lastName}`.trim();
  const updated = await updateEmployee(id, payload, updatedBy);
  return ok(updated, "Employee updated");
});

export const DELETE = withApiHandler<Ctx>("[/api/admin/employees/[id]] DELETE", async (req, ctx) => {
  const user = await getCurrentUser(req);
  if (user.role.name !== "Admin") throw new ApiError(403, "Admin access required");

  const { id } = await ctx.params;
  const performedBy = `${user.firstName} ${user.lastName}`.trim();
  await removeEmployee(id, performedBy);
  return ok(true, "Employee deleted");
});
