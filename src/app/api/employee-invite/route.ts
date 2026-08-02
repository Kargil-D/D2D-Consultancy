import { withApiHandler, ok } from "@/lib/apiHandler";
import { ApiError } from "@/lib/apiError";
import { resolveEmployeeInvite } from "@/services/employeeInviteService";

export const runtime = "nodejs";

/** Public: resolves an invite token so the "set your password" page can greet the employee by name, or show an expired/invalid state. */
export const GET = withApiHandler("[/api/employee-invite] GET", async (req) => {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) throw new ApiError(400, "Missing invite token");

  const invite = await resolveEmployeeInvite(token);
  if (!invite) throw new ApiError(400, "This invite link is invalid, expired, or already used");

  return ok({ fullName: invite.employee.fullName, email: invite.email });
});
