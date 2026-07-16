"use client";

import { Users, FileText } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import Breadcrumb from "@/components/admin/ui/Breadcrumb";
import DepartmentTiles from "@/components/admin/DepartmentTiles";

const SALES_TILES = [
  { label: "Leads", icon: Users, href: "/admin/leads" },
  { label: "Quotations", icon: FileText, href: "/admin/quotations" },
];

export default function AdminSalesPage() {
  return (
    <AdminShell title="Sales">
      <Breadcrumb items={[{ label: "Sales" }]} />
      <div className="mb-10 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Sales</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage leads and the sales pipeline.
        </p>
      </div>

      <DepartmentTiles tiles={SALES_TILES} />
    </AdminShell>
  );
}
