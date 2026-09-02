"use client";

import { SERIES_COLOR } from "@/components/admin/dashboard/dashboardColors";
import type { AdminDashboardOverview } from "@/types/admin";

export default function TopDestinations({ destinations }: { destinations: AdminDashboardOverview["topDestinations"] }) {
  if (destinations.length === 0) {
    return <p className="text-sm text-slate-400 py-6 text-center">No leads yet.</p>;
  }

  return (
    <div className="space-y-3.5">
      {destinations.map((d, i) => (
        <div key={d.destinationId} className="flex items-center gap-3">
          <span className="w-5 text-xs font-bold text-slate-400 shrink-0">{i + 1}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="font-medium text-slate-800 truncate">{d.name}</span>
              <span className="font-semibold text-slate-900 shrink-0 ml-2">{d.count}</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${d.pctOfMax}%`, backgroundColor: SERIES_COLOR.leads }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
