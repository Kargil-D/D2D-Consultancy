"use client";

import { STATUS } from "@/components/admin/dashboard/dashboardColors";
import type { AdminDashboardOverview } from "@/types/admin";

export default function EmployeePerformance({ rows }: { rows: AdminDashboardOverview["employeePerformance"] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-slate-400 py-6 text-center">No assigned leads yet.</p>;
  }

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-sm min-w-[420px]">
        <thead>
          <tr className="text-left text-[11px] font-semibold text-slate-500 uppercase border-b border-slate-100">
            <th className="px-1 py-2">Employee</th>
            <th className="px-1 py-2 text-right">Leads</th>
            <th className="px-1 py-2 text-right">Quotations</th>
            <th className="px-1 py-2 text-right">Bookings</th>
            <th className="px-1 py-2 text-right">Conversion</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.userId} className="border-b border-slate-50 last:border-0">
              <td className="px-1 py-2.5 font-medium text-slate-800">{r.name}</td>
              <td className="px-1 py-2.5 text-right text-slate-700">{r.leads}</td>
              <td className="px-1 py-2.5 text-right text-slate-700">{r.quotations}</td>
              <td className="px-1 py-2.5 text-right text-slate-700">{r.bookings}</td>
              <td className="px-1 py-2.5 text-right font-semibold" style={{ color: r.conversionRate >= 25 ? STATUS.good : r.conversionRate >= 10 ? STATUS.warning : STATUS.critical }}>
                {r.conversionRate}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
