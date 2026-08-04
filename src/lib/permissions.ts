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
