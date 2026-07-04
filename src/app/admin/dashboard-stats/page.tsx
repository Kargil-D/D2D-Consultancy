
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  MapPinned,
  Package,
  CalendarRange,
  Star,
  MessageSquare,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import Breadcrumb from "@/components/admin/ui/Breadcrumb";
import {
  destinationsApi,
  packagesApi,
  itinerariesApi,
  reviewsApi,
  enquiryConfigApi,
} from "@/lib/adminApi";
import type {
  AdminDestination,
  AdminPackage,
  AdminItinerary,
} from "@/types/admin";

interface Stats {
  destinations: number;
  packages: number;
  itineraries: number;
  reviews: number;
  enquiries: number;
  recentPackages: AdminPackage[];
  popularDestinations: AdminDestination[];
  recentItineraries: AdminItinerary[];
}

export default function AdminDashboardStatsPage() {
  const [stats, setStats] = useState<Stats>({
    destinations: 0,
    packages: 0,
    itineraries: 0,
    reviews: 0,
    enquiries: 0,
    recentPackages: [],
    popularDestinations: [],
    recentItineraries: [],
  });

  useEffect(() => {
    (async () => {
      const [d, p, i, r, e] = await Promise.all([
        destinationsApi.all(),
        packagesApi.all(),
        itinerariesApi.all(),
        reviewsApi.all(),
        enquiryConfigApi.all(),
      ]);
      setStats({
        destinations: d.data.length,
        packages: p.data.length,
        itineraries: i.data.length,
        reviews: r.data.length,
        enquiries: e.data.length,
        recentPackages: p.data.slice(0, 5),
        popularDestinations: d.data.filter((x) => x.isPopular).slice(0, 5),
        recentItineraries: i.data.slice(0, 5),
      });
    })();
  }, []);

  const cards = [
    {
      label: "Destinations",
      value: stats.destinations,
      icon: MapPinned,
      href: "/admin/destinations",
      color: "from-cyan-500 to-teal-500",
    },
    {
      label: "Campaigns",
      value: stats.packages,
      icon: Package,
      href: "/admin/packages-master",
      color: "from-blue-500 to-indigo-500",
    },
    {
      label: "Itineraries",
      value: stats.itineraries,
      icon: CalendarRange,
      href: "/admin/itineraries",
      color: "from-purple-500 to-fuchsia-500",
    },
    {
      label: "Reviews",
      value: stats.reviews,
      icon: Star,
      href: "/admin/reviews",
      color: "from-amber-500 to-orange-500",
    },
    {
      label: "Enquiry Configs",
      value: stats.enquiries,
      icon: MessageSquare,
      href: "/admin/enquiry-config",
      color: "from-emerald-500 to-green-500",
    },
    {
      label: "Hero Config",
      value: "Manage",
      icon: Sparkles,
      href: "/admin/hero",
      color: "from-rose-500 to-pink-500",
    },
  ];

  return (
    <AdminShell title="Dashboard">
      <Breadcrumb items={[{ label: "PM", href: "/admin/pm" }, { label: "Dashboard" }]} />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Welcome back, Admin</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage destinations, campaigns, and dynamic site content from one place.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.label}
              href={c.href}
              className="group relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
            >
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.color} text-white flex items-center justify-center mb-3 shadow-md`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{c.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{c.label}</div>
              <ArrowRight className="absolute top-4 right-4 w-4 h-4 text-slate-300 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          title="Recent Campaigns"
          empty="No campaigns yet."
          rows={stats.recentPackages.map((p) => ({
            title: p.name,
            subtitle: `${p.days}D / ${p.nights}N · ?${p.startingPrice.toLocaleString("en-IN")}`,
          }))}
        />
        <Card
          title="Popular Destinations"
          empty="Mark destinations as popular to see them here."
          rows={stats.popularDestinations.map((d) => ({
            title: d.name,
            subtitle: [d.country, d.state].filter(Boolean).join(" · "),
          }))}
        />
      </div>
    </AdminShell>
  );
}

function Card({
  title,
  rows,
  empty,
}: {
  title: string;
  rows: { title: string; subtitle: string }[];
  empty: string;
}) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-500" />
          {title}
        </h3>
      </div>
      <ul className="divide-y divide-slate-100">
        {rows.length === 0 ? (
          <li className="px-5 py-8 text-center text-sm text-slate-500">{empty}</li>
        ) : (
          rows.map((r, i) => (
            <li key={i} className="px-5 py-3">
              <div className="text-sm font-semibold text-slate-900">{r.title}</div>
              <div className="text-xs text-slate-500">{r.subtitle}</div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
