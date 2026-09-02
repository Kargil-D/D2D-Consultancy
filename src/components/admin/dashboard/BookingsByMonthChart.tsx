"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from "recharts";
import { CHART_INK, SERIES_COLOR } from "@/components/admin/dashboard/dashboardColors";

interface BookingsByMonthChartProps {
  data: { month: string; count: number }[];
}

export default function BookingsByMonthChart({ data }: BookingsByMonthChartProps) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid vertical={false} stroke={CHART_INK.gridline} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: CHART_INK.muted }} axisLine={{ stroke: CHART_INK.baseline }} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: CHART_INK.muted }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e1e0d9", fontSize: 12 }} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
          <Bar dataKey="count" name="Bookings" fill={SERIES_COLOR.bookings} radius={[4, 4, 0, 0]} maxBarSize={40} isAnimationActive={false}>
            <LabelList dataKey="count" position="top" style={{ fontSize: 11, fill: CHART_INK.secondary, fontWeight: 600 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
