import { withApiHandler, ok } from "@/lib/apiHandler";
import { ApiError } from "@/lib/apiError";
import { getCurrentUser } from "@/lib/auth";
import { toggleHotelMasterStatus } from "@/services/hotelMasterService";

export const runtime = "nodejs";

interface Ctx {
  params: Promise<{ id: string }>;
}

export const POST = withApiHandler<Ctx>("[/api/admin/hotel-master/[id]/toggle-status] POST", async (req, ctx) => {
  const user = await getCurrentUser(req);
  if (user.role.name !== "Admin") throw new ApiError(403, "Admin access required");

  const { id } = await ctx.params;
  const updatedBy = `${user.firstName} ${user.lastName}`.trim();
  const updated = await toggleHotelMasterStatus(id, updatedBy);
  if (!updated) throw new ApiError(404, "Hotel not found");
  return ok(updated, "Status updated");
});
