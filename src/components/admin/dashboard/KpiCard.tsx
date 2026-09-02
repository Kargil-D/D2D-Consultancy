"use client";

import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { STATUS } from "@/components/admin/dashboard/dashboardColors";
import type { AdminDashboardTrendPoint } from "@/types/admin";

interface KpiCardProps {
  icon: LucideIcon;
  iconGradient: string;
  label: string;
  value: string;
  changePct: number | null;
  sparkline?: AdminDashboardTrendPoint[];
  sparklineColor?: string;
}

export default function KpiCard({ icon: Icon, iconGradient, label, value, changePct, sparkline, sparklineColor }: KpiCardProps) {
  const up = (changePct ?? 0) >= 0;
  const deltaColor = changePct === null ? "text-slate-400" : up ? "text-[color:var(--kpi-good)]" : "text-[color:var(--kpi-critical)]";

  return (
    <div
      className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm overflow-hidden"
      style={{ ["--kpi-good" as string]: STATUS.good, ["--kpi-critical" as string]: STATUS.critical }}
    >
      <div className="flex items-start justify-between">
        <span className={`inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br ${iconGradient} text-white shrink-0`}>
          <Icon className="w-5 h-5" />
        </span>
      </div>
      <div className="mt-3">
        <div className="text-xs font-semibold text-slate-500">{label}</div>
        <div className="text-2xl font-bold text-slate-900 mt-0.5">{value}</div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        {changePct === null ? (
          <span className="text-xs font-semibold text-slate-400">vs last period</span>
        ) : (
          <span className={`inline-flex items-center gap-0.5 text-xs font-bold ${deltaColor}`}>
            {up ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {Math.abs(changePct)}% <span className="font-medium text-slate-400">vs last period</span>
          </span>
        )}
        {sparkline && sparkline.length > 1 && (
          <div className="w-16 h-8 -mb-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkline}>
                <defs>
                  <linearGradient id={`spark-${label.replace(/\s+/g, "")}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={sparklineColor} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={sparklineColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="count" stroke={sparklineColor} strokeWidth={2} fill={`url(#spark-${label.replace(/\s+/g, "")})`} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
