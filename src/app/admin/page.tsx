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
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import Breadcrumb from "@/components/admin/ui/Breadcrumb";
import DepartmentTiles from "@/components/admin/DepartmentTiles";
import { useAuth } from "@/contexts/AuthContext";

const HOME_TILES = [
  { label: "PM", icon: Boxes, href: "/admin/pm" },
  { label: "Sales", icon: Users, href: "/admin/sales" },
  { label: "Bookings", icon: CalendarCheck, href: "/admin/bookings" },
  { label: "CX", icon: Headphones },
  { label: "Finance", icon: Wallet, href: "/admin/finance" },
  { label: "Ticketing", icon: Ticket },
  { label: "Report", icon: FileBarChart },
];

export default function AdminHomePage() {
  const { user } = useAuth();
  const isAdmin = user?.roles.includes("admin") ?? false;

  const rosterTile = isAdmin
    ? { label: "Roster", icon: ClipboardList, href: "/admin/roster" }
    : { label: "My Roster", icon: ClipboardList, href: "/admin/my-roster" };
  const tiles = isAdmin
    ? [...HOME_TILES, rosterTile, { label: "Locker", icon: Lock, href: "/admin/locker" }]
    : [...HOME_TILES, rosterTile];

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
