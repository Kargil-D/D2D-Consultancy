import { withApiHandler, ok } from "@/lib/apiHandler";
import { ApiError } from "@/lib/apiError";
import { getCurrentUser } from "@/lib/auth";
import { EmployeeCreateSchema } from "@/lib/validation/employee";
import { listEmployees, listActiveEmployeesForPicker, createEmployee } from "@/services/employeeService";

export const runtime = "nodejs";

export const GET = withApiHandler("[/api/admin/employees] GET", async (req) => {
  const user = await getCurrentUser(req);
  if (user.role.name !== "Admin") throw new ApiError(403, "Admin access required");

  const url = new URL(req.url);

  if (url.searchParams.get("picker") === "true") {
    const items = await listActiveEmployeesForPicker(url.searchParams.get("excludeId") ?? undefined);
    return ok(items);
  }

  const search = url.searchParams.get("search") ?? undefined;
  const page = Number(url.searchParams.get("page") ?? "1");
  const pageSize = Number(url.searchParams.get("pageSize") ?? "10");
  const status = url.searchParams.get("status") ?? undefined;
  const department = url.searchParams.get("department") ?? undefined;

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (department) filter.department = department;

  const data = await listEmployees({ search, page, pageSize, filter });
  return ok(data);
});

export const POST = withApiHandler("[/api/admin/employees] POST", async (req) => {
  const user = await getCurrentUser(req);
  if (user.role.name !== "Admin") throw new ApiError(403, "Admin access required");

  const payload = EmployeeCreateSchema.parse(await req.json());
  const createdBy = `${user.firstName} ${user.lastName}`.trim();
  const created = await createEmployee(payload, createdBy);
  return ok(created, "Employee created");
});
