"use client";

import {
  Boxes,
  Users,
  CalendarCheck,
  Headphones,
  Wallet,
  ClipboardList,
  Ticket,
  FileBarChart,
  Lock,
  LayoutDashboard,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import Breadcrumb from "@/components/admin/ui/Breadcrumb";
import DepartmentTiles from "@/components/admin/DepartmentTiles";
import { useAuth } from "@/contexts/AuthContext";
import { DEPARTMENTS, canViewDepartment } from "@/lib/adminModules";
import type { PermissionMap } from "@/lib/adminModules";

// CX/Ticketing/Report have no href — no page exists behind them yet, so they're always shown
// (nothing to gate) rather than filtered by RolePermission like PM/Sales/Bookings/Finance.
const UNGATED_TILES = [
  { label: "CX", icon: Headphones },
  { label: "Ticketing", icon: Ticket },
  { label: "Report", icon: FileBarChart },
];

const HOME_TILES: Record<string, { label: string; icon: typeof Boxes; href: string }> = {
  PM: { label: "PM", icon: Boxes, href: "/admin/pm" },
  Sales: { label: "Sales", icon: Users, href: "/admin/sales" },
  Bookings: { label: "Bookings", icon: CalendarCheck, href: "/admin/bookings" },
  Finance: { label: "Finance", icon: Wallet, href: "/admin/finance" },
};

export default function AdminHomePage() {
  const { user } = useAuth();
  const isAdmin = user?.roles.includes("admin") ?? false;
  const permissions = user?.permissions as PermissionMap | undefined;

  const gatedTiles = DEPARTMENTS.filter((d) => (isAdmin || canViewDepartment(permissions, d)) && HOME_TILES[d.label])
    .map((d) => HOME_TILES[d.label]);

  const rosterTile = isAdmin
    ? { label: "Roster", icon: ClipboardList, href: "/admin/roster" }
    : { label: "My Roster", icon: ClipboardList, href: "/admin/my-roster" };
  const dashboardTile = { label: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard" };
  const tiles = isAdmin
    ? [dashboardTile, ...gatedTiles, ...UNGATED_TILES, rosterTile, { label: "Locker", icon: Lock, href: "/admin/locker" }]
    : [dashboardTile, ...gatedTiles, ...UNGATED_TILES, rosterTile];

  return (
    <AdminShell title="Home">
      <Breadcrumb items={[{ label: "Home" }]} />
      <div className="mb-10 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Welcome back, Admin</h1>
        <p className="text-sm text-slate-500 mt-1">We&apos;re here to increase your productivity!</p>
      </div>

      <DepartmentTiles tiles={tiles} />
    </AdminShell>
  );
}
