import { NextResponse, type NextRequest } from "next/server";
import { ApiError } from "@/lib/apiError";
import { getCurrentUser } from "@/lib/auth";
import { getEmployeeByUserId } from "@/services/employeeService";
import { getPayslip, logPayslipDownload } from "@/services/payrollService";
import { renderPayslipPdf, type PayslipPdfData } from "@/lib/payslipPdf";

export const runtime = "nodejs"; // @react-pdf/renderer needs the Node runtime

export async function GET(req: NextRequest, ctx: { params: Promise<{ year: string; month: string }> }) {
  try {
    const user = await getCurrentUser(req);
    if (user.role.name === "Customer") throw new ApiError(403, "Staff access required");

    const employee = await getEmployeeByUserId(user.id);
    if (!employee) throw new ApiError(404, "No employee profile is linked to your login account");

    const { year, month } = await ctx.params;
    const payslip = await getPayslip(employee.id, Number(year), Number(month));
    // Never expose a Draft payslip to self-service, even if the period exists — Admin hasn't signed off yet.
    if (!payslip || payslip.status !== "Finalized") {
      return NextResponse.json({ success: false, message: "Payslip not found for this period", data: null }, { status: 404 });
    }

    const data: PayslipPdfData = {
      employeeName: employee.fullName,
      employeeCode: employee.employeeCode,
      designation: employee.designation,
      department: employee.department,
      year: payslip.year,
      month: payslip.month,
      pfNumber: payslip.pfNumber,
      esiNumber: payslip.esiNumber,
      bankName: employee.bankName,
      accountNumberMasked: employee.accountNumberMasked,
      ifscCode: employee.ifscCode,
      basicSalary: payslip.basicSalary,
      hra: payslip.hra,
      otherAllowances: payslip.otherAllowances,
      bonus: payslip.bonus,
      pfDeduction: payslip.pfDeduction,
      esiDeduction: payslip.esiDeduction,
      professionalTax: payslip.professionalTax,
      tds: payslip.tds,
      otherDeductions: payslip.otherDeductions,
      grossPay: payslip.grossPay,
      totalDeductions: payslip.totalDeductions,
      netPay: payslip.netPay,
      notes: payslip.notes,
      generatedDate: new Date().toLocaleDateString("en-IN"),
    };

    const buffer = await renderPayslipPdf(data);
    const download = new URL(req.url).searchParams.get("download") === "1";
    const performedBy = `${user.firstName} ${user.lastName}`.trim() + " (self)";
    await logPayslipDownload(employee.id, Number(year), Number(month), performedBy);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="Payslip-${employee.employeeCode}-${year}-${month}.pdf"`,
      },
    });
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ success: false, message: err.message, data: null }, { status: err.statusCode });
    console.error("[/api/payroll/me/[year]/[month]/pdf] GET", err);
    return NextResponse.json({ success: false, message: "Internal error", data: null }, { status: 500 });
  }
}
