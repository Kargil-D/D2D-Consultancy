"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import type { AdminDashboardOverview } from "@/types/admin";

function daysSince(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

/** Adapted from the mockup's "Upcoming Follow-ups" — there's no due-date/reminder field on Lead
 * to show a scheduled time honestly, so this surfaces leads currently sitting in FollowUp
 * status instead, oldest-touched first (the ones most overdue for a next contact). */
export default function FollowUps({ leads }: { leads: AdminDashboardOverview["followUps"] }) {
  if (leads.length === 0) {
    return <p className="text-sm text-slate-400 py-6 text-center">No leads awaiting follow-up.</p>;
  }

  return (
    <div className="space-y-3">
      {leads.map((l) => (
        <Link
          key={l.id}
          href="/admin/leads"
          className="flex items-center gap-3 p-2.5 -mx-2.5 rounded-xl hover:bg-slate-50 transition-colors"
        >
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-50 text-amber-700 text-xs font-bold shrink-0">
            {l.customerName.trim().charAt(0).toUpperCase() || "?"}
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-slate-800 truncate">{l.customerName}</div>
            <div className="text-xs text-slate-500 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {l.destinationName} · Last touched {daysSince(l.updatedDate)}
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-amber-50 text-amber-700 shrink-0">
            Follow Up
          </span>
        </Link>
      ))}
    </div>
  );
}
