"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Users, FileText, BedDouble } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import Breadcrumb from "@/components/admin/ui/Breadcrumb";
import DepartmentTiles from "@/components/admin/DepartmentTiles";
import { useAuth } from "@/contexts/AuthContext";
import { canViewModule, type PermissionMap } from "@/lib/adminModules";
import type { AdminModule } from "@/types/admin";

const SALES_TILES: { label: string; icon: typeof Users; href: string; module: AdminModule }[] = [
  { label: "Leads", icon: Users, href: "/admin/leads", module: "Leads" },
  { label: "Quotations", icon: FileText, href: "/admin/quotations", module: "Quotations" },
  { label: "Hotel Master", icon: BedDouble, href: "/admin/hotel-master", module: "HotelMaster" },
];

export default function AdminSalesPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const isAdmin = user?.roles.includes("admin") ?? false;
  const permissions = user?.permissions as PermissionMap | undefined;
  const tiles = isAdmin ? SALES_TILES : SALES_TILES.filter((t) => canViewModule(permissions, t.module));

  useEffect(() => {
    if (!loading && user && !isAdmin && tiles.length === 0) router.replace("/admin");
  }, [loading, user, isAdmin, tiles.length, router]);

  return (
    <AdminShell title="Sales">
      <Breadcrumb items={[{ label: "Sales" }]} />
      <div className="mb-10 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Sales</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage leads and the sales pipeline.
        </p>
      </div>

      <DepartmentTiles tiles={tiles} />
    </AdminShell>
  );
}
