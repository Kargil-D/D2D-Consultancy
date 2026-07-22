import { withApiHandler, ok } from "@/lib/apiHandler";
import { ApiError } from "@/lib/apiError";
import { getCurrentUser } from "@/lib/auth";
import { CurrencyCreateSchema } from "@/lib/validation/currency";
import { listCurrencies, createCurrency } from "@/services/currencyService";

export const runtime = "nodejs";

/**
 * @swagger
 * /api/admin/currencies:
 *   get:
 *     summary: List currencies (Currency Master)
 *     tags: [Currency]
 *     responses:
 *       200:
 *         description: Paginated currency list
 *   post:
 *     summary: Add a new currency (Admin only)
 *     tags: [Currency]
 *     responses:
 *       200:
 *         description: Created currency
 *       403:
 *         description: Admin access required
 */
export const GET = withApiHandler("[/api/admin/currencies] GET", async (req) => {
  const url = new URL(req.url);
  const search = url.searchParams.get("search") ?? undefined;
  const page = Number(url.searchParams.get("page") ?? "1");
  const pageSize = Number(url.searchParams.get("pageSize") ?? "100");
  const status = url.searchParams.get("status") ?? undefined;

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;

  const data = await listCurrencies({ search, page, pageSize, filter });
  return ok(data);
});

export const POST = withApiHandler("[/api/admin/currencies] POST", async (req) => {
  const user = await getCurrentUser(req);
  if (user.role.name !== "Admin") throw new ApiError(403, "Admin access required");

  const payload = CurrencyCreateSchema.parse(await req.json());
  const updatedBy = `${user.firstName} ${user.lastName}`.trim();
  const created = await createCurrency(payload, updatedBy);
  return ok(created, "Currency created");
});
