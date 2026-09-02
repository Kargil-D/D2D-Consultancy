"use client";

import { UserPlus, FileText, Briefcase } from "lucide-react";
import { SERIES_COLOR } from "@/components/admin/dashboard/dashboardColors";
import type { AdminDashboardOverview } from "@/types/admin";

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const KIND_ICON: Record<AdminDashboardOverview["recentActivity"][number]["kind"], { icon: typeof UserPlus; color: string }> = {
  lead: { icon: UserPlus, color: SERIES_COLOR.leads },
  booking: { icon: Briefcase, color: SERIES_COLOR.bookings },
};

export default function RecentActivity({ items }: { items: AdminDashboardOverview["recentActivity"] }) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-400 py-6 text-center">No recent activity.</p>;
  }

  return (
    <div className="space-y-4">
      {items.map((a) => {
        const { icon: Icon, color } = KIND_ICON[a.kind] ?? { icon: FileText, color: SERIES_COLOR.quotations };
        return (
          <div key={a.id} className="flex items-start gap-3">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full shrink-0" style={{ backgroundColor: `${color}1A`, color }}>
              <Icon className="w-3.5 h-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-slate-800">
                <span className="font-semibold">{a.context}</span> — {a.message}
              </p>
              <span className="text-xs text-slate-400">{timeAgo(a.createdDate)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
