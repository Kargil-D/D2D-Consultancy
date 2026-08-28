import { z } from "zod";
import { withApiHandler, ok } from "@/lib/apiHandler";
import { ApiError } from "@/lib/apiError";
import { requireModuleAccess } from "@/lib/permissions";
import { getEmployee } from "@/services/employeeService";
import { listPayslips, upsertPayslip } from "@/services/payrollService";
import { PayslipUpsertSchema } from "@/lib/validation/payroll";

export const runtime = "nodejs";

interface Ctx {
  params: Promise<{ id: string }>;
}

const PeriodSchema = z.object({ year: z.coerce.number().int().min(2000).max(2100), month: z.coerce.number().int().min(1).max(12) });

export const GET = withApiHandler<Ctx>("[/api/admin/employees/[id]/payroll] GET", async (req, ctx) => {
  await requireModuleAccess(req, "Payroll", "canView");
  const { id } = await ctx.params;
  const items = await listPayslips(id);
  return ok(items);
});

/** Creates/updates one month's figures. Never self-editable — salary changes an Admin makes on their own linked employee record are blocked, same rule as a real payroll desk. */
export const POST = withApiHandler<Ctx>("[/api/admin/employees/[id]/payroll] POST", async (req, ctx) => {
  const user = await requireModuleAccess(req, "Payroll", "canAdd");
  const { id } = await ctx.params;

  const employee = await getEmployee(id);
  if (!employee) throw new ApiError(404, "Employee not found");
  if (employee.userId && employee.userId === user.id) throw new ApiError(403, "You cannot edit your own payroll");

  const body = await req.json();
  const { year, month } = PeriodSchema.parse(body);
  const payload = PayslipUpsertSchema.parse(body);
  const generatedBy = `${user.firstName} ${user.lastName}`.trim();

  const saved = await upsertPayslip(id, year, month, payload, generatedBy);
  return ok(saved, "Payslip saved");
});
