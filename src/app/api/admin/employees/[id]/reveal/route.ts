import { withApiHandler, ok } from "@/lib/apiHandler";
import { ApiError } from "@/lib/apiError";
import { getCurrentUser } from "@/lib/auth";
import { revealSensitiveField } from "@/services/employeeService";

export const runtime = "nodejs";

interface Ctx {
  params: Promise<{ id: string }>;
}

/** The only endpoint that ever returns a plaintext Aadhaar/bank account number — gated to Admin and logged to EmployeeAuditLog on every call. */
export const GET = withApiHandler<Ctx>("[/api/admin/employees/[id]/reveal] GET", async (req, ctx) => {
  const user = await getCurrentUser(req);
  if (user.role.name !== "Admin") throw new ApiError(403, "Admin access required to view this field");

  const { id } = await ctx.params;
  const url = new URL(req.url);
  const field = url.searchParams.get("field");
  if (field !== "aadhaarNumber" && field !== "accountNumber") throw new ApiError(400, "Invalid field");

  const performedBy = `${user.firstName} ${user.lastName}`.trim();
  const value = await revealSensitiveField(id, field, performedBy);
  if (value === null) throw new ApiError(404, "Employee not found");
  return ok({ value });
});
