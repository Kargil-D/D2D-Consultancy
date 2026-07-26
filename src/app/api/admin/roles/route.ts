import { withApiHandler, ok } from "@/lib/apiHandler";
import { ApiError } from "@/lib/apiError";
import { getCurrentUser } from "@/lib/auth";
import { RoleCreateSchema } from "@/lib/validation/role";
import { listRoles, listActiveRolesForPicker, createRole } from "@/services/roleService";

export const runtime = "nodejs";

export const GET = withApiHandler("[/api/admin/roles] GET", async (req) => {
  const user = await getCurrentUser(req);
  if (user.role.name !== "Admin") throw new ApiError(403, "Admin access required");

  const url = new URL(req.url);

  if (url.searchParams.get("picker") === "true") {
    const items = await listActiveRolesForPicker();
    return ok(items);
  }

  const search = url.searchParams.get("search") ?? undefined;
  const page = Number(url.searchParams.get("page") ?? "1");
  const pageSize = Number(url.searchParams.get("pageSize") ?? "10");
  const status = url.searchParams.get("status") ?? undefined;

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;

  const data = await listRoles({ search, page, pageSize, filter });
  return ok(data);
});

export const POST = withApiHandler("[/api/admin/roles] POST", async (req) => {
  const user = await getCurrentUser(req);
  if (user.role.name !== "Admin") throw new ApiError(403, "Admin access required");

  const payload = RoleCreateSchema.parse(await req.json());
  const created = await createRole(payload);
  return ok(created, "Role created");
});
