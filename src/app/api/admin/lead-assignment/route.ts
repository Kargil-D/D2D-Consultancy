import { withApiHandler, ok } from "@/lib/apiHandler";
import { ApiError } from "@/lib/apiError";
import { getCurrentUser } from "@/lib/auth";
import { getBoardData } from "@/services/leadAssignmentService";

export const runtime = "nodejs";

export const GET = withApiHandler("[/api/admin/lead-assignment] GET", async (req) => {
  const user = await getCurrentUser(req);
  if (user.role.name !== "Admin") throw new ApiError(403, "Admin access required");

  const url = new URL(req.url);
  const date = url.searchParams.get("date") ?? undefined;
  const board = await getBoardData(date);
  return ok(board);
});
