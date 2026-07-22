import { withApiHandler, ok } from "@/lib/apiHandler";
import { ApiError } from "@/lib/apiError";
import { getCurrentUser } from "@/lib/auth";
import { HotelMasterUpdateSchema } from "@/lib/validation/hotelMaster";
import { getHotelMaster, updateHotelMaster, removeHotelMaster } from "@/services/hotelMasterService";

export const runtime = "nodejs";

interface Ctx {
  params: Promise<{ id: string }>;
}

export const GET = withApiHandler<Ctx>("[/api/admin/hotel-master/[id]] GET", async (_req, ctx) => {
  const { id } = await ctx.params;
  const hotel = await getHotelMaster(id);
  if (!hotel) throw new ApiError(404, "Hotel not found");
  return ok(hotel);
});

export const PUT = withApiHandler<Ctx>("[/api/admin/hotel-master/[id]] PUT", async (req, ctx) => {
  const user = await getCurrentUser(req);
  if (user.role.name !== "Admin") throw new ApiError(403, "Admin access required");

  const { id } = await ctx.params;
  const payload = HotelMasterUpdateSchema.parse(await req.json());
  const updatedBy = `${user.firstName} ${user.lastName}`.trim();
  const updated = await updateHotelMaster(id, payload, updatedBy);
  return ok(updated, "Hotel updated");
});

export const DELETE = withApiHandler<Ctx>("[/api/admin/hotel-master/[id]] DELETE", async (req, ctx) => {
  const user = await getCurrentUser(req);
  if (user.role.name !== "Admin") throw new ApiError(403, "Admin access required");

  const { id } = await ctx.params;
  await removeHotelMaster(id);
  return ok(true, "Hotel deleted");
});
