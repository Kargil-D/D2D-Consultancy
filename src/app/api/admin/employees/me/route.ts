import type { NextRequest } from "next/server";
import { withApiHandler, ok } from "@/lib/apiHandler";
import { ApiError } from "@/lib/apiError";
import { getCurrentUser } from "@/lib/auth";
import { EmployeeSelfUpdateSchema } from "@/lib/validation/employee";
import { getEmployeeByUserId, updateOwnEmployeeProfile } from "@/services/employeeService";

export const runtime = "nodejs";

/** Always the Employee linked to whoever is logged in — the target is never taken from the
 * request, so nobody can read or edit another employee's record through this route. */
async function resolveOwnEmployee(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (user.role.name === "Customer") throw new ApiError(403, "Staff access required");

  const employee = await getEmployeeByUserId(user.id);
  if (!employee) throw new ApiError(404, "No employee profile is linked to your login account");
  return { user, employee };
}

/** Powers "My Profile" — any staff member's own record (Aadhaar/account number masked). */
export const GET = withApiHandler("[/api/admin/employees/me] GET", async (req) => {
  const { employee } = await resolveOwnEmployee(req);
  return ok(employee);
});

/** Self-service edit of contact, address, emergency contact, government IDs and bank details.
 * Employment & login fields are rejected by EmployeeSelfUpdateSchema; every change is written to
 * the employee's Activity Log as a "(self)" edit so Admin can see it. */
export const PATCH = withApiHandler("[/api/admin/employees/me] PATCH", async (req) => {
  const { user, employee } = await resolveOwnEmployee(req);
  const payload = EmployeeSelfUpdateSchema.parse(await req.json());
  const updated = await updateOwnEmployeeProfile(employee.id, payload, `${user.firstName} ${user.lastName}`.trim());
  return ok(updated, "Profile updated");
});
