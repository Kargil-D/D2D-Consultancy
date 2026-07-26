import { withApiHandler, ok } from "@/lib/apiHandler";
import { ApiError } from "@/lib/apiError";
import { getCurrentUser } from "@/lib/auth";
import { getEmployeeByUserId } from "@/services/employeeService";

export const runtime = "nodejs";

/** Powers "Profile Settings" in the admin header — resolves the Employee record linked to whoever is currently logged in. */
export const GET = withApiHandler("[/api/admin/employees/me] GET", async (req) => {
  const user = await getCurrentUser(req);
  if (user.role.name !== "Admin") throw new ApiError(403, "Admin access required");

  const employee = await getEmployeeByUserId(user.id);
  if (!employee) throw new ApiError(404, "No employee profile is linked to your login account");
  return ok(employee);
});
