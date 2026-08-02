import { withApiHandler, ok } from "@/lib/apiHandler";
import { ApiError } from "@/lib/apiError";
import { EmployeeInviteAcceptSchema } from "@/lib/validation/employeeInvite";
import { acceptEmployeeInvite } from "@/services/employeeInviteService";

export const runtime = "nodejs";

/** Public: the employee sets their own password here, completing their own login creation. */
export const POST = withApiHandler("[/api/employee-invite/accept] POST", async (req) => {
  const { token, password } = EmployeeInviteAcceptSchema.parse(await req.json());

  try {
    await acceptEmployeeInvite(token, password);
    return ok(true, "Login created — you can now sign in");
  } catch (err) {
    throw new ApiError(400, err instanceof Error ? err.message : "Unable to complete registration");
  }
});
