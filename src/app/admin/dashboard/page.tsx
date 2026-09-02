"use client";

import AdminShell from "@/components/admin/AdminShell";
import Breadcrumb from "@/components/admin/ui/Breadcrumb";
import Dashboard from "@/components/admin/dashboard/Dashboard";

export default function DashboardPage() {
  return (
    <AdminShell title="Dashboard">
      <Breadcrumb items={[{ label: "Home", href: "/admin" }, { label: "Dashboard" }]} />
      <Dashboard />
    </AdminShell>
  );
}
