"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  MapPinned,
  Ticket,
  Package,
  ArrowRightLeft,
  Sparkles,
  Star,
  MessageSquare,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import Breadcrumb from "@/components/admin/ui/Breadcrumb";
import DepartmentTiles from "@/components/admin/DepartmentTiles";
import { useAuth } from "@/contexts/AuthContext";
import { canViewModule, type PermissionMap } from "@/lib/adminModules";
import type { AdminModule } from "@/types/admin";

const PM_TILES: { label: string; icon: typeof LayoutDashboard; href: string; module: AdminModule }[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard-stats", module: "Dashboard" },
  { label: "Destinations", icon: MapPinned, href: "/admin/destinations", module: "Destinations" },
  { label: "Activities", icon: Ticket, href: "/admin/activities", module: "Activities" },
  { label: "Campaigns", icon: Package, href: "/admin/packages-master", module: "Campaigns" },
  { label: "Transfer Types", icon: ArrowRightLeft, href: "/admin/transfers", module: "TransferTypes" },
  { label: "Hero Section", icon: Sparkles, href: "/admin/hero", module: "HeroSection" },
  { label: "Reviews", icon: Star, href: "/admin/reviews", module: "Reviews" },
  { label: "Enquiry Config", icon: MessageSquare, href: "/admin/enquiry-config", module: "EnquiryConfig" },
];

export default function AdminPmPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const isAdmin = user?.roles.includes("admin") ?? false;
  const permissions = user?.permissions as PermissionMap | undefined;
  const tiles = isAdmin ? PM_TILES : PM_TILES.filter((t) => canViewModule(permissions, t.module));

  useEffect(() => {
    if (!loading && user && !isAdmin && tiles.length === 0) router.replace("/admin");
  }, [loading, user, isAdmin, tiles.length, router]);

  return (
    <AdminShell title="PM">
      <Breadcrumb items={[{ label: "PM" }]} />
      <div className="mb-10 text-center">
        <h1 className="text-2xl font-bold text-slate-900">PM</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage destinations, campaigns, and dynamic site content.
        </p>
      </div>

      <DepartmentTiles tiles={tiles} />
    </AdminShell>
  );
}
