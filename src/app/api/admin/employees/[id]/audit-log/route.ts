import { withApiHandler, ok } from "@/lib/apiHandler";
import { listAuditLogs } from "@/services/employeeService";

export const runtime = "nodejs";

interface Ctx {
  params: Promise<{ id: string }>;
}

export const GET = withApiHandler<Ctx>("[/api/admin/employees/[id]/audit-log] GET", async (_req, ctx) => {
  const { id } = await ctx.params;
  const items = await listAuditLogs(id);
  return ok(items);
});
