import { NextResponse, type NextRequest } from "next/server";
import { ApiError } from "@/lib/apiError";
import { requireModuleAccess } from "@/lib/permissions";
import { getEmployee } from "@/services/employeeService";
import { getPayslip, logPayslipDownload } from "@/services/payrollService";
import { renderPayslipPdf, type PayslipPdfData } from "@/lib/payslipPdf";

export const runtime = "nodejs"; // @react-pdf/renderer needs the Node runtime

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string; year: string; month: string }> }) {
  try {
    const user = await requireModuleAccess(req, "Payroll", "canView");
    const { id, year, month } = await ctx.params;

    const employee = await getEmployee(id);
    if (!employee) return NextResponse.json({ success: false, message: "Employee not found", data: null }, { status: 404 });

    const payslip = await getPayslip(id, Number(year), Number(month));
    if (!payslip) return NextResponse.json({ success: false, message: "Payslip not found for this period", data: null }, { status: 404 });

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
    const performedBy = `${user.firstName} ${user.lastName}`.trim();
    await logPayslipDownload(id, Number(year), Number(month), performedBy);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="Payslip-${employee.employeeCode}-${year}-${month}.pdf"`,
      },
    });
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ success: false, message: err.message, data: null }, { status: err.statusCode });
    console.error("[/api/admin/employees/[id]/payroll/[year]/[month]/pdf] GET", err);
    return NextResponse.json({ success: false, message: "Internal error", data: null }, { status: 500 });
  }
}
