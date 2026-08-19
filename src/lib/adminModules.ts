import type { AdminModule } from "@/types/admin";

export type PermissionAction = "canView" | "canAdd" | "canEdit" | "canDelete";
export const FULL_CRUD: PermissionAction[] = ["canView", "canAdd", "canEdit", "canDelete"];

export interface DepartmentModule {
  module: AdminModule;
  actions: PermissionAction[];
}

export interface Department {
  label: string;
  modules: DepartmentModule[];
}

/**
 * Single source of truth for which AdminModule values live under which admin department —
 * mirrors the real nav (src/app/admin/{page,pm,sales,finance,bookings}/page.tsx). Used both by
 * RoleForm's Module Permissions matrix (grouped rows) and by the nav/page-level gating that
 * decides what a staff member can see based on their role's RolePermission rows.
 * Employees/Roles ("Locker") are excluded — that section is Admin-only regardless of this list
 * (see ADMIN_ONLY_PREFIXES in src/middleware.ts). CX/Ticketing/Report/Roster aren't included
 * either — those Home tiles have no page behind them yet.
 */
export const DEPARTMENTS: Department[] = [
  {
    label: "PM",
    modules: [
      { module: "Dashboard", actions: ["canView"] },
      { module: "Destinations", actions: FULL_CRUD },
      { module: "Activities", actions: FULL_CRUD },
      { module: "Campaigns", actions: FULL_CRUD },
      { module: "TransferTypes", actions: FULL_CRUD },
      { module: "HeroSection", actions: ["canView", "canEdit"] },
      { module: "Reviews", actions: FULL_CRUD },
      { module: "EnquiryConfig", actions: FULL_CRUD },
    ],
  },
  {
    label: "Sales",
    modules: [
      { module: "Leads", actions: FULL_CRUD },
      { module: "Quotations", actions: FULL_CRUD },
      { module: "HotelMaster", actions: FULL_CRUD },
    ],
  },
  { label: "Bookings", modules: [{ module: "Bookings", actions: FULL_CRUD }] },
  { label: "Finance", modules: [{ module: "CurrencyMaster", actions: FULL_CRUD }] },
];

export type PermissionMap = Record<AdminModule, { canView: boolean; canAdd: boolean; canEdit: boolean; canDelete: boolean }>;

/** A department is visible if the role can view at least one module it bundles. */
export function canViewDepartment(permissions: PermissionMap | undefined, dept: Department): boolean {
  if (!permissions) return false;
  return dept.modules.some((m) => permissions[m.module]?.canView);
}

export function canViewModule(permissions: PermissionMap | undefined, module: AdminModule): boolean {
  return !!permissions?.[module]?.canView;
}
