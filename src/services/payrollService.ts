import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/apiError";
import type { Payslip } from "@/generated/prisma/client";
import type { PayslipUpsert } from "@/lib/validation/payroll";

async function logPayrollAudit(employeeId: string, action: string, performedBy: string, field?: string) {
  await prisma.employeeAuditLog.create({ data: { employeeId, action, field, performedBy } });
}

export function computeTotals(p: Pick<Payslip, "basicSalary" | "hra" | "otherAllowances" | "bonus" | "pfDeduction" | "esiDeduction" | "professionalTax" | "tds" | "otherDeductions">) {
  const grossPay = p.basicSalary + p.hra + p.otherAllowances + p.bonus;
  const totalDeductions = p.pfDeduction + p.esiDeduction + p.professionalTax + p.tds + p.otherDeductions;
  return { grossPay, totalDeductions, netPay: grossPay - totalDeductions };
}

export type PayslipWithTotals = Payslip & ReturnType<typeof computeTotals>;

const withTotals = (p: Payslip): PayslipWithTotals => ({ ...p, ...computeTotals(p) });

/** Full payslip history for one employee, newest period first — powers the admin Payroll tab's history list. */
export async function listPayslips(employeeId: string): Promise<PayslipWithTotals[]> {
  const rows = await prisma.payslip.findMany({
    where: { employeeId },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });
  return rows.map(withTotals);
}

export async function getPayslip(employeeId: string, year: number, month: number): Promise<PayslipWithTotals | null> {
  const row = await prisma.payslip.findUnique({ where: { employeeId_year_month: { employeeId, year, month } } });
  return row ? withTotals(row) : null;
}

/** Only Finalized payslips are ever shown to the employee themselves — Drafts are Admin's private working state. */
export async function listFinalizedPayslips(employeeId: string): Promise<PayslipWithTotals[]> {
  const rows = await prisma.payslip.findMany({
    where: { employeeId, status: "Finalized" },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });
  return rows.map(withTotals);
}

/** Creates or updates a period's figures. Throws if that period is already Finalized — an Admin must explicitly re-open it (there is no re-open action by design: a Finalized slip an employee may have already downloaded should not silently change). */
export async function upsertPayslip(employeeId: string, year: number, month: number, data: PayslipUpsert, generatedBy: string): Promise<PayslipWithTotals> {
  const existing = await prisma.payslip.findUnique({ where: { employeeId_year_month: { employeeId, year, month } } });
  if (existing?.status === "Finalized") {
    throw new ApiError(409, "This payslip is already finalized and cannot be edited");
  }

  const row = await prisma.payslip.upsert({
    where: { employeeId_year_month: { employeeId, year, month } },
    update: { ...data, generatedBy },
    create: { employeeId, year, month, ...data, generatedBy },
  });

  await logPayrollAudit(employeeId, existing ? "PAYROLL_UPDATED" : "PAYROLL_CREATED", generatedBy, `${year}-${String(month).padStart(2, "0")}`);
  return withTotals(row);
}

export async function finalizePayslip(employeeId: string, year: number, month: number, performedBy: string): Promise<PayslipWithTotals> {
  const existing = await prisma.payslip.findUnique({ where: { employeeId_year_month: { employeeId, year, month } } });
  if (!existing) throw new ApiError(404, "Payslip not found for this period");
  if (existing.status === "Finalized") return withTotals(existing);

  const row = await prisma.payslip.update({
    where: { id: existing.id },
    data: { status: "Finalized", finalizedAt: new Date() },
  });
  await logPayrollAudit(employeeId, "PAYROLL_FINALIZED", performedBy, `${year}-${String(month).padStart(2, "0")}`);
  return withTotals(row);
}

/** Draft only — a Finalized payslip is never deletable, only ever superseded by a fresh period. */
export async function deletePayslip(employeeId: string, year: number, month: number, performedBy: string) {
  const existing = await prisma.payslip.findUnique({ where: { employeeId_year_month: { employeeId, year, month } } });
  if (!existing) return;
  if (existing.status === "Finalized") throw new ApiError(409, "Finalized payslips cannot be deleted");

  await prisma.payslip.delete({ where: { id: existing.id } });
  await logPayrollAudit(employeeId, "PAYROLL_DELETED", performedBy, `${year}-${String(month).padStart(2, "0")}`);
}

export async function logPayslipDownload(employeeId: string, year: number, month: number, performedBy: string) {
  await logPayrollAudit(employeeId, "PAYROLL_DOWNLOADED", performedBy, `${year}-${String(month).padStart(2, "0")}`);
}
