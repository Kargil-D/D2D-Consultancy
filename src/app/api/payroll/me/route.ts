import type { NextRequest } from "next/server";
import { withApiHandler, ok } from "@/lib/apiHandler";
import { ApiError } from "@/lib/apiError";
import { getCurrentUser } from "@/lib/auth";
import { getEmployeeByUserId } from "@/services/employeeService";
import { listFinalizedPayslips } from "@/services/payrollService";

export const runtime = "nodejs";

async function resolveOwnEmployee(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (user.role.name === "Customer") throw new ApiError(403, "Staff access required");

  const employee = await getEmployeeByUserId(user.id);
  if (!employee) throw new ApiError(404, "No employee profile is linked to your login account");
  return employee;
}

/** Self-view for "My Payslips" — any staff member, never someone else's, and only ever the payslips Admin has finalized. */
export const GET = withApiHandler("[/api/payroll/me] GET", async (req) => {
  const employee = await resolveOwnEmployee(req);
  const items = await listFinalizedPayslips(employee.id);
  return ok(items);
});
