"use client";

import {
  LayoutDashboard,
  MapPinned,
  Package,
  CalendarRange,
  Hotel,
  ArrowRightLeft,
  Sparkles,
  Star,
  MessageSquare,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import Breadcrumb from "@/components/admin/ui/Breadcrumb";
import DepartmentTiles from "@/components/admin/DepartmentTiles";

const PM_TILES = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard-stats" },
  { label: "Destinations", icon: MapPinned, href: "/admin/destinations" },
  { label: "Campaigns", icon: Package, href: "/admin/packages-master" },
  { label: "Itineraries", icon: CalendarRange, href: "/admin/itineraries" },
  { label: "Hotels", icon: Hotel, href: "/admin/hotels" },
  { label: "Transfer Types", icon: ArrowRightLeft, href: "/admin/transfers" },
  { label: "Hero Section", icon: Sparkles, href: "/admin/hero" },
  { label: "Reviews", icon: Star, href: "/admin/reviews" },
  { label: "Enquiry Config", icon: MessageSquare, href: "/admin/enquiry-config" },
];

export default function AdminPmPage() {
  return (
    <AdminShell title="PM">
      <Breadcrumb items={[{ label: "PM" }]} />
      <div className="mb-10 text-center">
        <h1 className="text-2xl font-bold text-slate-900">PM</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage destinations, campaigns, and dynamic site content.
        </p>
      </div>

      <DepartmentTiles tiles={PM_TILES} />
    </AdminShell>
  );
}
