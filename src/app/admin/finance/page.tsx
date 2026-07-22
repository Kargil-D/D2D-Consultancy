"use client";

import { Coins } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import Breadcrumb from "@/components/admin/ui/Breadcrumb";
import DepartmentTiles from "@/components/admin/DepartmentTiles";

const FINANCE_TILES = [
  { label: "Currency Master", icon: Coins, href: "/admin/currency-master" },
];

export default function AdminFinancePage() {
  return (
    <AdminShell title="Finance">
      <Breadcrumb items={[{ label: "Finance" }]} />
      <div className="mb-10 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Finance</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage exchange rates and other financial configuration.
        </p>
      </div>

      <DepartmentTiles tiles={FINANCE_TILES} />
    </AdminShell>
  );
}
