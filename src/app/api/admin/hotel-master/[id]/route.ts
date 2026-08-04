import { withApiHandler, ok } from "@/lib/apiHandler";
import { ApiError } from "@/lib/apiError";
import { requireModuleAccess } from "@/lib/permissions";
import { HotelMasterUpdateSchema } from "@/lib/validation/hotelMaster";
import { getHotelMaster, updateHotelMaster, removeHotelMaster } from "@/services/hotelMasterService";

export const runtime = "nodejs";

interface Ctx {
  params: Promise<{ id: string }>;
}

export const GET = withApiHandler<Ctx>("[/api/admin/hotel-master/[id]] GET", async (req, ctx) => {
  await requireModuleAccess(req, "HotelMaster", "canView");
  const { id } = await ctx.params;
  const hotel = await getHotelMaster(id);
  if (!hotel) throw new ApiError(404, "Hotel not found");
  return ok(hotel);
});

export const PUT = withApiHandler<Ctx>("[/api/admin/hotel-master/[id]] PUT", async (req, ctx) => {
  const user = await requireModuleAccess(req, "HotelMaster", "canEdit");

  const { id } = await ctx.params;
  const payload = HotelMasterUpdateSchema.parse(await req.json());
  const updatedBy = `${user.firstName} ${user.lastName}`.trim();
  const updated = await updateHotelMaster(id, payload, updatedBy);
  return ok(updated, "Hotel updated");
});

export const DELETE = withApiHandler<Ctx>("[/api/admin/hotel-master/[id]] DELETE", async (req, ctx) => {
  await requireModuleAccess(req, "HotelMaster", "canDelete");

  const { id } = await ctx.params;
  await removeHotelMaster(id);
  return ok(true, "Hotel deleted");
});
