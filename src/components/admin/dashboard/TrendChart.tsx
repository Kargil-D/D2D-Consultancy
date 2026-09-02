"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { CHART_INK, SERIES_COLOR } from "@/components/admin/dashboard/dashboardColors";
import type { AdminDashboardTrendPoint } from "@/types/admin";

interface TrendChartProps {
  leads: AdminDashboardTrendPoint[];
  quotations: AdminDashboardTrendPoint[];
  bookings: AdminDashboardTrendPoint[];
}

const formatDay = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

export default function TrendChart({ leads, quotations, bookings }: TrendChartProps) {
  const data = leads.map((l, i) => ({
    date: formatDay(l.date),
    Leads: l.count,
    Quotations: quotations[i]?.count ?? 0,
    Bookings: bookings[i]?.count ?? 0,
  }));

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid vertical={false} stroke={CHART_INK.gridline} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: CHART_INK.muted }} axisLine={{ stroke: CHART_INK.baseline }} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: CHART_INK.muted }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: "1px solid #e1e0d9", fontSize: 12 }}
            labelStyle={{ color: CHART_INK.primary, fontWeight: 600 }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" iconSize={8} />
          <Line type="monotone" dataKey="Leads" stroke={SERIES_COLOR.leads} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          <Line type="monotone" dataKey="Quotations" stroke={SERIES_COLOR.quotations} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          <Line type="monotone" dataKey="Bookings" stroke={SERIES_COLOR.bookings} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
