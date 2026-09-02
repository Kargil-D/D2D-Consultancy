"use client";

import { useEffect, useState } from "react";
import { Users, FileText, Briefcase, Target, IndianRupee, MapPin, UserCheck, CalendarClock, Activity, PieChart as PieChartIcon } from "lucide-react";
import KpiCard from "@/components/admin/dashboard/KpiCard";
import TrendChart from "@/components/admin/dashboard/TrendChart";
import DonutChart from "@/components/admin/dashboard/DonutChart";
import TopDestinations from "@/components/admin/dashboard/TopDestinations";
import EmployeePerformance from "@/components/admin/dashboard/EmployeePerformance";
import BookingsByMonthChart from "@/components/admin/dashboard/BookingsByMonthChart";
import RecentActivity from "@/components/admin/dashboard/RecentActivity";
import FollowUps from "@/components/admin/dashboard/FollowUps";
import { SERIES_COLOR, BOOKING_STATUS_COLOR, LEAD_SOURCE_COLOR } from "@/components/admin/dashboard/dashboardColors";
import { useAuth } from "@/contexts/AuthContext";
import { dashboardApi } from "@/lib/adminApi";
import { formatINRCompact } from "@/utils/format";
import type { AdminDashboardOverview } from "@/types/admin";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-900 text-sm">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<AdminDashboardOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dashboardApi.get().then((res) => {
      if (res.success) setData(res.data);
      else setError(res.message || "Unable to load dashboard");
    });
  }, []);

  if (error) {
    return <div className="rounded-2xl bg-white border border-slate-200 p-6 text-sm text-rose-600">{error}</div>;
  }

  if (!data) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-32 rounded-2xl bg-white border border-slate-200 animate-pulse" />
        ))}
      </div>
    );
  }

  const firstName = user?.name?.trim().split(/\s+/)[0] ?? "there";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{greeting()}, {firstName}! 👋</h1>
        <p className="text-sm text-slate-500 mt-0.5">Here&apos;s what&apos;s happening with your business today.</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <KpiCard icon={Users} iconGradient="from-blue-500 to-indigo-500" label="Total Leads" value={String(data.kpis.leads.value)} changePct={data.kpis.leads.changePct} sparkline={data.trend.leads} sparklineColor={SERIES_COLOR.leads} />
        <KpiCard icon={FileText} iconGradient="from-orange-500 to-amber-500" label="Total Quotations" value={String(data.kpis.quotations.value)} changePct={data.kpis.quotations.changePct} sparkline={data.trend.quotations} sparklineColor={SERIES_COLOR.quotations} />
        <KpiCard icon={Briefcase} iconGradient="from-emerald-500 to-teal-500" label="Total Bookings" value={String(data.kpis.bookings.value)} changePct={data.kpis.bookings.changePct} sparkline={data.trend.bookings} sparklineColor={SERIES_COLOR.bookings} />
        <KpiCard icon={Target} iconGradient="from-violet-500 to-purple-500" label="Conversion Rate" value={`${data.kpis.conversionRate.value}%`} changePct={data.kpis.conversionRate.changePct} />
        <KpiCard icon={IndianRupee} iconGradient="from-rose-500 to-pink-500" label="Total Revenue" value={formatINRCompact(data.kpis.revenue.value)} changePct={data.kpis.revenue.changePct} />
      </div>

      {/* Trend + Leads by Source */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <Section title={`Leads, Quotations & Bookings — Last ${data.trend.days} Days`}>
            <TrendChart leads={data.trend.leads} quotations={data.trend.quotations} bookings={data.trend.bookings} />
          </Section>
        </div>
        <Section title="Leads by Source">
          <DonutChart
            centerLabel="Total Leads"
            centerValue={String(data.leadsBySource.reduce((s, x) => s + x.count, 0))}
            slices={data.leadsBySource.map((s) => ({ label: s.source, value: s.count, color: LEAD_SOURCE_COLOR[s.source] ?? SERIES_COLOR.leads }))}
          />
        </Section>
      </div>

      {/* Destinations + Employee performance + Bookings by month */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Section title="Top Destinations by Leads" action={<MapPin className="w-4 h-4 text-slate-400" />}>
          <TopDestinations destinations={data.topDestinations} />
        </Section>
        {data.employeePerformance.length > 0 && (
          <Section title="Employee Performance" action={<UserCheck className="w-4 h-4 text-slate-400" />}>
            <EmployeePerformance rows={data.employeePerformance} />
          </Section>
        )}
        <div className={data.employeePerformance.length > 0 ? "" : "xl:col-span-2"}>
          <Section title="Bookings by Month">
            <BookingsByMonthChart data={data.bookingsByMonth} />
          </Section>
        </div>
      </div>

      {/* Activity + Booking status + Follow-ups */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Section title="Recent Activities" action={<Activity className="w-4 h-4 text-slate-400" />}>
          <RecentActivity items={data.recentActivity} />
        </Section>
        <Section title="Booking Status" action={<PieChartIcon className="w-4 h-4 text-slate-400" />}>
          <DonutChart
            centerLabel="Total Bookings"
            centerValue={String(data.bookingStatus.reduce((s, x) => s + x.count, 0))}
            slices={data.bookingStatus.map((s) => ({ label: s.status, value: s.count, color: BOOKING_STATUS_COLOR[s.status] ?? SERIES_COLOR.bookings }))}
          />
        </Section>
        <Section title="Leads Awaiting Follow-up" action={<CalendarClock className="w-4 h-4 text-slate-400" />}>
          <FollowUps leads={data.followUps} />
        </Section>
      </div>
    </div>
  );
}
