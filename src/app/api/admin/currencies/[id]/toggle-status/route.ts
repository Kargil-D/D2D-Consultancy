import { withApiHandler, ok } from "@/lib/apiHandler";
import { ApiError } from "@/lib/apiError";
import { requireModuleAccess } from "@/lib/permissions";
import { toggleCurrencyStatus } from "@/services/currencyService";

export const runtime = "nodejs";

interface Ctx {
  params: Promise<{ id: string }>;
}

export const POST = withApiHandler<Ctx>("[/api/admin/currencies/[id]/toggle-status] POST", async (req, ctx) => {
  const user = await requireModuleAccess(req, "CurrencyMaster", "canEdit");

  const { id } = await ctx.params;
  const updatedBy = `${user.firstName} ${user.lastName}`.trim();
  const updated = await toggleCurrencyStatus(id, updatedBy);
  if (!updated) throw new ApiError(404, "Currency not found");
  return ok(updated, "Status updated");
});
