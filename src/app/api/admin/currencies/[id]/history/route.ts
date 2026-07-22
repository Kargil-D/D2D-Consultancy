import { withApiHandler, ok } from "@/lib/apiHandler";
import { listRateHistory } from "@/services/currencyService";

export const runtime = "nodejs";

interface Ctx {
  params: Promise<{ id: string }>;
}

export const GET = withApiHandler<Ctx>("[/api/admin/currencies/[id]/history] GET", async (_req, ctx) => {
  const { id } = await ctx.params;
  const history = await listRateHistory(id);
  return ok(history);
});
