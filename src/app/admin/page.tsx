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
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import Breadcrumb from "@/components/admin/ui/Breadcrumb";
import DepartmentTiles from "@/components/admin/DepartmentTiles";

const HOME_TILES = [
  { label: "PM", icon: Boxes, href: "/admin/pm" },
  { label: "Sales", icon: Users, href: "/admin/sales" },
  { label: "Bookings", icon: CalendarCheck },
  { label: "CX", icon: Headphones },
  { label: "Finance", icon: Wallet },
  { label: "Roster", icon: ClipboardList },
  { label: "Ticketing", icon: Ticket },
  { label: "Report", icon: FileBarChart },
];

export default function AdminHomePage() {
  return (
    <AdminShell title="Home">
      <Breadcrumb items={[{ label: "Home" }]} />
      <div className="mb-10 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Welcome back, Admin</h1>
        <p className="text-sm text-slate-500 mt-1">We&apos;re here to increase your productivity!</p>
      </div>

      <DepartmentTiles tiles={HOME_TILES} />
    </AdminShell>
  );
}
