"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, Flame } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import Breadcrumb from "@/components/admin/ui/Breadcrumb";
import { useToast } from "@/components/admin/ui/Toast";
import { rosterApi } from "@/lib/adminApi";
import type { AdminMyRoster, RosterStatus } from "@/types/admin";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

const todayStr = () => new Date().toISOString().slice(0, 10);
const pad2 = (n: number) => String(n).padStart(2, "0");

/** Cycles Unmarked -> Present -> Absent -> Unmarked on each click. */
function nextStatus(current: RosterStatus | undefined): RosterStatus | null {
  if (current === undefined) return "Present";
  if (current === "Present") return "Absent";
  return null;
}

export default function MyRosterPage() {
  const { notify } = useToast();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [roster, setRoster] = useState<AdminMyRoster | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await rosterApi.mine(year, month);
    if (res.success) setRoster(res.data);
    else {
      setError(res.message || "Unable to load your roster");
      notify(res.message || "Unable to load your roster", "error");
    }
    setLoading(false);
  }, [year, month, notify]);

  useEffect(() => {
    load();
  }, [load]);

  const shiftMonth = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m > 12) { m = 1; y += 1; }
    if (m < 1) { m = 12; y -= 1; }
    setMonth(m);
    setYear(y);
  };

  const goToday = () => {
    setYear(now.getFullYear());
    setMonth(now.getMonth() + 1);
  };

  const cellClick = async (day: number) => {
    if (!roster) return;
    if (new Date(year, month - 1, day).getDay() === 0) return; // Sunday is Weekly Off, not self-markable
    const key = `${year}-${pad2(month)}-${pad2(day)}`;
    const current = roster.days[key];
    const next = nextStatus(current);

    // Optimistic update so clicking feels instant.
    setRoster((r) => {
      if (!r) return r;
      const days = { ...r.days };
      if (next === null) delete days[key];
      else days[key] = next;
      return { ...r, days };
    });

    const res = await rosterApi.markMine(key, next);
    if (!res.success) {
      notify(res.message || "Unable to update attendance", "error");
      load();
    }
  };

  const daysInMonth = roster?.daysInMonth ?? new Date(year, month, 0).getDate();
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const dateKey = (day: number) => `${year}-${pad2(month)}-${pad2(day)}`;
  const isWeekend = (day: number) => new Date(year, month - 1, day).getDay() === 0;
  const isToday = (day: number) => dateKey(day) === todayStr();

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const leadingBlanks = Array.from({ length: firstWeekday }, (_, i) => i);

  const statusOf = (day: number): RosterStatus | "Weekend" | "Unmarked" => {
    if (isWeekend(day)) return "Weekend";
    return roster?.days[dateKey(day)] ?? "Unmarked";
  };

  const presentCount = roster ? Object.values(roster.days).filter((s) => s === "Present").length : 0;
  const absentCount = roster ? Object.values(roster.days).filter((s) => s === "Absent").length : 0;
  const totalMarked = presentCount + absentCount;
  const pct = totalMarked > 0 ? Math.round((presentCount / totalMarked) * 100) : null;

  // Longest current streak of consecutive Present days up through today (or month end).
  let streak = 0;
  if (roster) {
    const cutoff = year === now.getFullYear() && month === now.getMonth() + 1 ? now.getDate() : daysInMonth;
    for (let d = cutoff; d >= 1; d -= 1) {
      if (isWeekend(d)) continue;
      if (roster.days[dateKey(d)] === "Present") streak += 1;
      else break;
    }
  }

  const CELL_BASE = "aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-semibold transition-colors";
  const variantCls: Record<string, string> = {
    Present: "bg-emerald-500 text-white shadow-sm",
    Absent: "bg-rose-500 text-white shadow-sm",
    Weekend: "bg-slate-50 text-slate-300",
    Unmarked: "bg-slate-100 text-slate-400",
  };

  return (
    <AdminShell title="My Roster">
      <Breadcrumb items={[{ label: "My Roster" }]} />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My Roster</h1>
        <p className="text-sm text-slate-500 mt-0.5">Your attendance record — click a day to mark yourself Present or Absent.</p>
      </div>

      {error && !loading && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3 mb-6">{error}</div>
      )}

      {!error && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
          <div className="rounded-2xl bg-white border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => shiftMonth(-1)} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50"><ChevronLeft className="w-4 h-4" /></button>
                <span className="text-lg font-bold text-slate-900 min-w-[160px] text-center">{MONTH_NAMES[month - 1]} {year}</span>
                <button type="button" onClick={() => shiftMonth(1)} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50"><ChevronRight className="w-4 h-4" /></button>
              </div>
              <button type="button" onClick={goToday} className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium hover:bg-slate-50">Today</button>
            </div>

            <div className="grid grid-cols-7 gap-1.5 mb-1.5">
              {WEEKDAY_LABELS.map((w, i) => (
                <div key={i} className="text-center text-[11px] font-semibold text-slate-400 uppercase">{w}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {leadingBlanks.map((b) => <div key={`b${b}`} />)}
              {days.map((d) => {
                const s = statusOf(d);
                const locked = s === "Weekend";
                return (
                  <button
                    type="button"
                    key={d}
                    onClick={() => cellClick(d)}
                    disabled={locked}
                    title={locked ? "Sunday — Weekly Off" : `Click to cycle: Unmarked → Present → Absent`}
                    className={`${CELL_BASE} ${variantCls[s]} ${isToday(d) ? "ring-2 ring-blue-400 ring-offset-1" : ""} ${locked ? "cursor-default" : "cursor-pointer hover:opacity-90 active:scale-95"}`}
                  >
                    <span>{d}</span>
                    {s === "Present" && <CheckCircle2 className="w-3 h-3 mt-0.5" />}
                    {s === "Absent" && <XCircle className="w-3 h-3 mt-0.5" />}
                  </button>
                );
              })}
            </div>
            {loading && <p className="text-center text-sm text-slate-500 mt-4">Loading…</p>}

            <div className="flex items-center gap-4 mt-5 pt-4 border-t border-slate-100 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500 inline-block" /> Present</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-rose-500 inline-block" /> Absent</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-100 inline-block" /> Unmarked</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-50 border border-slate-200 inline-block" /> Sunday (Weekly Off)</span>
            </div>
            <p className="text-xs text-slate-400 mt-3">Click any day (except Sunday) to cycle through Unmarked → Present → Absent. Admin can still adjust your attendance from Roster Management.</p>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-white/80">Attendance this month</div>
              <div className="text-4xl font-bold mt-1">{pct !== null ? `${pct}%` : "—"}</div>
              <div className="text-xs text-white/80 mt-1">{presentCount} present · {absentCount} absent</div>
            </div>
            <div className="rounded-2xl bg-white border border-slate-200 p-5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <Flame className="w-3.5 h-3.5 text-orange-500" /> Current streak
              </div>
              <div className="text-3xl font-bold text-slate-900 mt-1">{streak} {streak === 1 ? "day" : "days"}</div>
              <div className="text-xs text-slate-400 mt-1">Consecutive present days, weekends excluded.</div>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
