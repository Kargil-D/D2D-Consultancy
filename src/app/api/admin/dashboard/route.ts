import { withApiHandler, ok } from "@/lib/apiHandler";
import { getCurrentUser } from "@/lib/auth";
import { getDashboardOverview } from "@/services/dashboardService";

export const runtime = "nodejs";

/**
 * Any authenticated staff member can load the dashboard (same visibility as the department
 * tiles it sits above) — only the per-salesperson Employee Performance section is gated to
 * Admin, since it's the one part that surfaces individual staff numbers.
 */
export const GET = withApiHandler("[/api/admin/dashboard] GET", async (req) => {
  const user = await getCurrentUser(req);
  const overview = await getDashboardOverview(user.role.name === "Admin");
  return ok(overview);
});
