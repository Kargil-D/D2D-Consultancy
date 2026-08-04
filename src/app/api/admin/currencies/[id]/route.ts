import { withApiHandler, ok } from "@/lib/apiHandler";
import { ApiError } from "@/lib/apiError";
import { requireModuleAccess } from "@/lib/permissions";
import { CurrencyUpdateSchema } from "@/lib/validation/currency";
import { getCurrency, updateCurrency } from "@/services/currencyService";

export const runtime = "nodejs";

interface Ctx {
  params: Promise<{ id: string }>;
}

/**
 * @swagger
 * /api/admin/currencies/{id}:
 *   get:
 *     summary: Get a currency
 *     tags: [Currency]
 *   put:
 *     summary: Update a currency's rate/metadata (Admin only) — rate changes are logged to history
 *     tags: [Currency]
 *     responses:
 *       403:
 *         description: Admin access required
 */
export const GET = withApiHandler<Ctx>("[/api/admin/currencies/[id]] GET", async (req, ctx) => {
  await requireModuleAccess(req, "CurrencyMaster", "canView");
  const { id } = await ctx.params;
  const currency = await getCurrency(id);
  if (!currency) throw new ApiError(404, "Currency not found");
  return ok(currency);
});

export const PUT = withApiHandler<Ctx>("[/api/admin/currencies/[id]] PUT", async (req, ctx) => {
  const user = await requireModuleAccess(req, "CurrencyMaster", "canEdit");

  const { id } = await ctx.params;
  const payload = CurrencyUpdateSchema.parse(await req.json());
  const updatedBy = `${user.firstName} ${user.lastName}`.trim();
  const updated = await updateCurrency(id, payload, updatedBy);
  return ok(updated, "Currency updated");
});
