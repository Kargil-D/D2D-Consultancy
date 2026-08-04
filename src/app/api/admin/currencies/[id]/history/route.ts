import { withApiHandler, ok } from "@/lib/apiHandler";
import { requireModuleAccess } from "@/lib/permissions";
import { listRateHistory } from "@/services/currencyService";

export const runtime = "nodejs";

interface Ctx {
  params: Promise<{ id: string }>;
}

export const GET = withApiHandler<Ctx>("[/api/admin/currencies/[id]/history] GET", async (req, ctx) => {
  await requireModuleAccess(req, "CurrencyMaster", "canView");
  const { id } = await ctx.params;
  const history = await listRateHistory(id);
  return ok(history);
});
