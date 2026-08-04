import { withApiHandler, ok } from "@/lib/apiHandler";
import { requireModuleAccess } from "@/lib/permissions";
import { HotelMasterCreateSchema } from "@/lib/validation/hotelMaster";
import { listHotelMasters, listActiveHotelMasters, createHotelMaster } from "@/services/hotelMasterService";

export const runtime = "nodejs";

export const GET = withApiHandler("[/api/admin/hotel-master] GET", async (req) => {
  await requireModuleAccess(req, "HotelMaster", "canView");
  const url = new URL(req.url);

  if (url.searchParams.get("all") === "true") {
    const items = await listActiveHotelMasters();
    return ok(items);
  }

  const search = url.searchParams.get("search") ?? undefined;
  const page = Number(url.searchParams.get("page") ?? "1");
  const pageSize = Number(url.searchParams.get("pageSize") ?? "10");
  const status = url.searchParams.get("status") ?? undefined;
  const destinationId = url.searchParams.get("destinationId") ?? undefined;

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (destinationId) filter.destinationId = destinationId;

  const data = await listHotelMasters({ search, page, pageSize, filter });
  return ok(data);
});

export const POST = withApiHandler("[/api/admin/hotel-master] POST", async (req) => {
  const user = await requireModuleAccess(req, "HotelMaster", "canAdd");

  const payload = HotelMasterCreateSchema.parse(await req.json());
  const createdBy = `${user.firstName} ${user.lastName}`.trim();
  const created = await createHotelMaster(payload, createdBy);
  return ok(created, "Hotel added");
});
