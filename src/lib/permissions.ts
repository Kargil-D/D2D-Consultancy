import type { NextRequest } from "next/server";
import type { AdminModule, RolePermission } from "@/generated/prisma/client";
import { ApiError } from "@/lib/apiError";
import { getCurrentUser } from "@/lib/auth";

type PermissionAction = "canView" | "canAdd" | "canEdit" | "canDelete";

const ACTION_VERB: Record<PermissionAction, string> = {
  canView: "view",
  canAdd: "add to",
  canEdit: "edit",
  canDelete: "delete from",
};

/** Admin bypasses the RolePermission matrix entirely (super-user), same rule as buildPermissionMap in userService.ts. */
export function hasModulePermission(
  user: { role: { name: string; permissions: RolePermission[] } },
  module: AdminModule,
  action: PermissionAction,
): boolean {
  if (user.role.name === "Admin") return true;
  const perm = user.role.permissions.find((p) => p.module === module);
  return !!perm?.[action];
}

/** Throws ApiError(401) if not authenticated, ApiError(403) if authenticated but the role's RolePermission matrix doesn't grant this module+action. Returns the authenticated user otherwise, for callers that need it (e.g. to stamp createdBy/updatedBy). */
export async function requireModuleAccess(req: NextRequest, module: AdminModule, action: PermissionAction) {
  const user = await getCurrentUser(req);
  if (!hasModulePermission(user, module, action)) {
    throw new ApiError(403, `You don't have permission to ${ACTION_VERB[action]} ${module}`);
  }
  return user;
}

/** Like requireModuleAccess, but passes if the role holds the action on ANY of the given modules — for shared lookup data (e.g. campaign hotels feeding both the Campaigns editor and the Quotation builder). */
export async function requireAnyModuleAccess(req: NextRequest, modules: AdminModule[], action: PermissionAction) {
  const user = await getCurrentUser(req);
  if (!modules.some((m) => hasModulePermission(user, m, action))) {
    throw new ApiError(403, `You don't have permission to ${ACTION_VERB[action]} ${modules.join(" / ")}`);
  }
  return user;
}

/** Throws ApiError(401) if not authenticated, ApiError(403) if authenticated but not the Admin
 * role — for features gated to Admin outright rather than to a specific module permission (e.g.
 * the Supplier Payments Due notifications, which surface the same master-only cost data as the
 * Supplier Invoice card but aren't part of that RolePermission matrix). */
export async function requireAdmin(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (user.role.name !== "Admin") {
    throw new ApiError(403, "Admin only");
  }
  return user;
}

/** Modules allowed to READ a campaign's itinerary/hotel/transfer plan: the Campaigns editor itself, the Quotation builder (pre-fills from it) and the dashboard stats page. Writes stay Campaigns-only. */
export const CAMPAIGN_PLAN_READ_MODULES: AdminModule[] = ["Campaigns", "Quotations", "Dashboard"];

/** Row-level visibility identity — separate from module-action permission. Admin sees every record regardless of assignment; everyone else is scoped to records assigned to them (see leadVisibilityScope/quotationVisibilityScope/bookingVisibilityScope). */
export interface Viewer {
  id: string;
  isAdmin: boolean;
}

export function toViewer(user: { id: string; role: { name: string } }): Viewer {
  return { id: user.id, isAdmin: user.role.name === "Admin" };
}
