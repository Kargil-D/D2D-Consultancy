"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MapPinned,
  Package,
  CalendarRange,
  Sparkles,
  Star,
  MessageSquare,
} from "lucide-react";
import Logo from "@/components/common/Logo";
import { ToastProvider } from "@/components/admin/ui/Toast";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/destinations", label: "Destinations", icon: MapPinned },
  { href: "/admin/packages", label: "Campaigns", icon: Package },
  { href: "/admin/itineraries", label: "Itineraries", icon: CalendarRange },
  { href: "/admin/hero", label: "Hero Section", icon: Sparkles },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/enquiry-config", label: "Enquiry Config", icon: MessageSquare },
];

interface AdminShellProps {
  children: React.ReactNode;
  title?: string;
}

export default function AdminShell({ children, title }: AdminShellProps) {
  const pathname = usePathname() ?? "";

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-100">
        <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-white/10">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
            <div className="text-sm font-semibold tracking-wide">
              Admin / Backend{title ? ` — ${title}` : ""}
            </div>
            <Link
              href="/"
              className="text-xs font-medium text-white/70 hover:text-white"
            >
              View site ?
            </Link>
          </div>
        </header>

        <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-0">
          <aside className="hidden lg:block bg-white border-r border-slate-200 min-h-[calc(100vh-3.5rem)] sticky top-14">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
              <Logo size="sm" tone="dark" />
            </div>
            <div className="px-4 py-3 flex items-center gap-3 border-b border-slate-100">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center text-white text-sm font-bold">
                A
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">Admin</div>
                <div className="text-xs text-slate-500">Super Admin</div>
              </div>
            </div>
            <nav className="py-2">
              {NAV.map((n) => {
                const Icon = n.icon;
                const active = isActive(n.href, n.exact);
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    className={`flex items-center gap-3 px-6 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? "bg-blue-50 text-blue-700 border-l-4 border-blue-600"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-l-4 border-transparent"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {n.label}
                  </Link>
                );
              })}
            </nav>
          </aside>

          <nav className="lg:hidden flex overflow-x-auto bg-white border-b border-slate-200">
            {NAV.map((n) => {
              const Icon = n.icon;
              const active = isActive(n.href, n.exact);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium whitespace-nowrap border-b-2 ${
                    active
                      ? "border-blue-600 text-blue-700"
                      : "border-transparent text-slate-600"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <main className="bg-slate-100 p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
