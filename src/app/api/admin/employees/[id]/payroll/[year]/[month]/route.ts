import { withApiHandler, ok } from "@/lib/apiHandler";
import { ApiError } from "@/lib/apiError";
import { requireModuleAccess } from "@/lib/permissions";
import { getEmployee } from "@/services/employeeService";
import { getPayslip, deletePayslip } from "@/services/payrollService";

export const runtime = "nodejs";

interface Ctx {
  params: Promise<{ id: string; year: string; month: string }>;
}

export const GET = withApiHandler<Ctx>("[/api/admin/employees/[id]/payroll/[year]/[month]] GET", async (req, ctx) => {
  await requireModuleAccess(req, "Payroll", "canView");
  const { id, year, month } = await ctx.params;
  const payslip = await getPayslip(id, Number(year), Number(month));
  if (!payslip) throw new ApiError(404, "Payslip not found for this period");
  return ok(payslip);
});

export const DELETE = withApiHandler<Ctx>("[/api/admin/employees/[id]/payroll/[year]/[month]] DELETE", async (req, ctx) => {
  const user = await requireModuleAccess(req, "Payroll", "canDelete");
  const { id, year, month } = await ctx.params;

  const employee = await getEmployee(id);
  if (!employee) throw new ApiError(404, "Employee not found");
  if (employee.userId && employee.userId === user.id) throw new ApiError(403, "You cannot edit your own payroll");

  const performedBy = `${user.firstName} ${user.lastName}`.trim();
  await deletePayslip(id, Number(year), Number(month), performedBy);
  return ok(true, "Payslip deleted");
});
