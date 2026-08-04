"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Coins } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import Breadcrumb from "@/components/admin/ui/Breadcrumb";
import DepartmentTiles from "@/components/admin/DepartmentTiles";
import { useAuth } from "@/contexts/AuthContext";
import { canViewModule, type PermissionMap } from "@/lib/adminModules";
import type { AdminModule } from "@/types/admin";

const FINANCE_TILES: { label: string; icon: typeof Coins; href: string; module: AdminModule }[] = [
  { label: "Currency Master", icon: Coins, href: "/admin/currency-master", module: "CurrencyMaster" },
];

export default function AdminFinancePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const isAdmin = user?.roles.includes("admin") ?? false;
  const permissions = user?.permissions as PermissionMap | undefined;
  const tiles = isAdmin ? FINANCE_TILES : FINANCE_TILES.filter((t) => canViewModule(permissions, t.module));

  useEffect(() => {
    if (!loading && user && !isAdmin && tiles.length === 0) router.replace("/admin");
  }, [loading, user, isAdmin, tiles.length, router]);

  return (
    <AdminShell title="Finance">
      <Breadcrumb items={[{ label: "Finance" }]} />
      <div className="mb-10 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Finance</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage exchange rates and other financial configuration.
        </p>
      </div>

      <DepartmentTiles tiles={tiles} />
    </AdminShell>
  );
}
