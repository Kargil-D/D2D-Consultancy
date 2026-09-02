"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { CHART_INK } from "@/components/admin/dashboard/dashboardColors";

interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  slices: DonutSlice[];
  centerLabel: string;
  centerValue: string;
}

/** Legend lives beside the donut, not inside recharts' own — direct labels for every slice
 * (never color-alone identity), matching the skill's <=4-series-direct-label / always-legend rule. */
export default function DonutChart({ slices, centerLabel, centerValue }: DonutChartProps) {
  const total = slices.reduce((sum, s) => sum + s.value, 0);

  return (
    <div className="flex items-center gap-6">
      <div className="relative w-40 h-40 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={slices} dataKey="value" nameKey="label" innerRadius={52} outerRadius={72} paddingAngle={2} strokeWidth={2} stroke="#fcfcfb" isAnimationActive={false}>
              {slices.map((s) => (
                <Cell key={s.label} fill={s.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ borderRadius: 12, border: "1px solid #e1e0d9", fontSize: 12 }}
              formatter={(value, name) => {
                const n = Number(value) || 0;
                return [`${n} (${total > 0 ? Math.round((n / total) * 100) : 0}%)`, name];
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-lg font-bold text-slate-900">{centerValue}</span>
          <span className="text-[10px] font-semibold text-slate-500">{centerLabel}</span>
        </div>
      </div>

      <div className="flex-1 space-y-2 min-w-0">
        {slices.map((s) => (
          <div key={s.label} className="flex items-center justify-between gap-2 text-sm">
            <span className="flex items-center gap-2 min-w-0 text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
              <span className="truncate">{s.label}</span>
            </span>
            <span className="font-semibold text-slate-900 shrink-0">
              {total > 0 ? Math.round((s.value / total) * 100) : 0}% <span className="text-slate-400 font-normal" style={{ color: CHART_INK.muted }}>({s.value})</span>
            </span>
          </div>
        ))}
        {slices.length === 0 && <p className="text-sm text-slate-400">No data yet.</p>}
      </div>
    </div>
  );
}
