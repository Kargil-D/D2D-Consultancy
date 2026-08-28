import { withApiHandler, ok } from "@/lib/apiHandler";
import { ApiError } from "@/lib/apiError";
import { requireModuleAccess } from "@/lib/permissions";
import { getEmployee } from "@/services/employeeService";
import { finalizePayslip } from "@/services/payrollService";

export const runtime = "nodejs";

interface Ctx {
  params: Promise<{ id: string; year: string; month: string }>;
}

/** Locks a payslip so it can be downloaded — there is deliberately no "un-finalize" action, only a fresh save for a new period. */
export const POST = withApiHandler<Ctx>("[/api/admin/employees/[id]/payroll/[year]/[month]/finalize] POST", async (req, ctx) => {
  const user = await requireModuleAccess(req, "Payroll", "canEdit");
  const { id, year, month } = await ctx.params;

  const employee = await getEmployee(id);
  if (!employee) throw new ApiError(404, "Employee not found");
  if (employee.userId && employee.userId === user.id) throw new ApiError(403, "You cannot finalize your own payroll");

  const performedBy = `${user.firstName} ${user.lastName}`.trim();
  const finalized = await finalizePayslip(id, Number(year), Number(month), performedBy);
  return ok(finalized, "Payslip finalized");
});
