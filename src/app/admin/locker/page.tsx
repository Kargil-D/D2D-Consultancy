"use client";

import { Users, ShieldCheck, Shuffle } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import Breadcrumb from "@/components/admin/ui/Breadcrumb";
import DepartmentTiles from "@/components/admin/DepartmentTiles";

const LOCKER_TILES = [
  { label: "Employees", icon: Users, href: "/admin/employees" },
  { label: "Roles", icon: ShieldCheck, href: "/admin/roles" },
  { label: "Lead Assignment", icon: Shuffle, href: "/admin/lead-assignment" },
];

export default function AdminLockerPage() {
  return (
    <AdminShell title="Locker">
      <Breadcrumb items={[{ label: "Locker" }]} />
      <div className="mb-10 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Locker</h1>
        <p className="text-sm text-slate-500 mt-1">
          Admin-only — employee records and role/permission management.
        </p>
      </div>

      <DepartmentTiles tiles={LOCKER_TILES} />
    </AdminShell>
  );
}
