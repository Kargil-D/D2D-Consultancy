"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft, ChevronRight, Search, Download, CheckCheck, Users, TrendingUp,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import Breadcrumb from "@/components/admin/ui/Breadcrumb";
import { useToast } from "@/components/admin/ui/Toast";
import { rosterApi } from "@/lib/adminApi";
import type { AdminRosterGrid, RosterStatus } from "@/types/admin";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const todayStr = () => new Date().toISOString().slice(0, 10);
const pad2 = (n: number) => String(n).padStart(2, "0");

/** Cycles Unmarked -> Present -> Absent -> Unmarked on each click. */
function nextStatus(current: RosterStatus | undefined): RosterStatus | null {
  if (current === undefined) return "Present";
  if (current === "Present") return "Absent";
  return null;
}

const CELL_STYLES: Record<"Present" | "Absent" | "Unmarked" | "Weekend", string> = {
  Present: "bg-emerald-500 text-white",
  Absent: "bg-rose-500 text-white",
  Unmarked: "bg-slate-100 text-slate-300 hover:bg-slate-200",
  Weekend: "bg-slate-50 text-slate-300",
};

export default function AdminRosterPage() {
  const { notify } = useToast();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-12
  const [search, setSearch] = useState("");
  const [grid, setGrid] = useState<AdminRosterGrid | null>(null);
  const [loading, setLoading] = useState(true);
  const [bulking, setBulking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await rosterApi.grid({ year, month, search: search || undefined });
    if (res.success) setGrid(res.data);
    else notify(res.message || "Unable to load roster", "error");
    setLoading(false);
  }, [year, month, search, notify]);

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

  const days = useMemo(() => (grid ? Array.from({ length: grid.daysInMonth }, (_, i) => i + 1) : []), [grid]);
  const dateKey = (day: number) => `${year}-${pad2(month)}-${pad2(day)}`;
  const isWeekend = (day: number) => new Date(year, month - 1, day).getDay() === 0;
  const isToday = (day: number) => dateKey(day) === todayStr();
  const todayInMonth = grid ? days.some((d) => isToday(d)) : false;

  const cellClick = async (employeeId: string, day: number) => {
    if (!grid) return;
    const key = dateKey(day);
    const row = grid.employees.find((e) => e.id === employeeId);
    if (!row) return;
    const current = row.days[key];
    const next = nextStatus(current);

    // Optimistic local update — snappy marking without a full grid reload per click.
    setGrid((g) => {
      if (!g) return g;
      return {
        ...g,
        employees: g.employees.map((e) => {
          if (e.id !== employeeId) return e;
          const nextDays = { ...e.days };
          if (next === null) delete nextDays[key];
          else nextDays[key] = next;
          const presentCount = Object.values(nextDays).filter((s) => s === "Present").length;
          const absentCount = Object.values(nextDays).filter((s) => s === "Absent").length;
          return { ...e, days: nextDays, presentCount, absentCount };
        }),
        summary: {
          present: g.summary.present + (next === "Present" ? 1 : 0) - (current === "Present" ? 1 : 0),
          absent: g.summary.absent + (next === "Absent" ? 1 : 0) - (current === "Absent" ? 1 : 0),
        },
      };
    });

    const res = await rosterApi.mark(employeeId, key, next);
    if (!res.success) {
      notify(res.message || "Unable to update attendance", "error");
      load();
    }
  };

  const markAllPresentToday = async () => {
    if (!grid || !todayInMonth) return;
    setBulking(true);
    try {
      const res = await rosterApi.bulkMark(grid.employees.map((e) => e.id), todayStr(), "Present");
      if (!res.success) return notify(res.message || "Unable to bulk mark", "error");
      notify(res.message || "Marked", "success");
      load();
    } finally {
      setBulking(false);
    }
  };

  const exportCsv = () => {
    if (!grid) return;
    const header = ["Employee Code", "Name", "Department", ...days.map((d) => String(d)), "Present", "Absent"];
    const rows = grid.employees.map((e) => [
      e.employeeCode,
      e.fullName,
      e.department || "—",
      ...days.map((d) => e.days[dateKey(d)]?.[0] ?? ""),
      String(e.presentCount),
      String(e.absentCount),
    ]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `roster-${MONTH_NAMES[month - 1]}-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const teamSize = grid?.employees.length ?? 0;
  const totalMarks = (grid?.summary.present ?? 0) + (grid?.summary.absent ?? 0);
  const attendancePct = totalMarks > 0 ? Math.round(((grid?.summary.present ?? 0) / totalMarks) * 100) : null;

  return (
    <AdminShell title="Roster">
      <Breadcrumb items={[{ label: "Roster" }]} />
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Roster Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">Daily attendance — click a cell to cycle Unmarked → Present → Absent.</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="rounded-xl bg-white border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500"><Users className="w-3.5 h-3.5" /> Team</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{teamSize}</div>
        </div>
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Present (month)</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{grid?.summary.present ?? 0}</div>
        </div>
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-rose-700">Absent (month)</div>
          <div className="text-2xl font-bold text-rose-700 mt-1">{grid?.summary.absent ?? 0}</div>
        </div>
        <div className="rounded-xl bg-white border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500"><TrendingUp className="w-3.5 h-3.5" /> Attendance</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{attendancePct !== null ? `${attendancePct}%` : "—"}</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => shiftMonth(-1)} className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50"><ChevronLeft className="w-4 h-4" /></button>
          <button type="button" onClick={goToday} className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium hover:bg-slate-50">Today</button>
          <button type="button" onClick={() => shiftMonth(1)} className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50"><ChevronRight className="w-4 h-4" /></button>
          <span className="ml-2 text-lg font-bold text-slate-900">{MONTH_NAMES[month - 1]} {year}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              className="pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search employee…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={markAllPresentToday}
            disabled={!todayInMonth || bulking || teamSize === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
            title={todayInMonth ? "Mark every employee shown as Present for today" : "Today isn't in the month you're viewing"}
          >
            <CheckCheck className="w-3.5 h-3.5" /> Mark All Present (Today)
          </button>
          <button
            type="button"
            onClick={exportCsv}
            disabled={!grid || teamSize === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="text-sm border-collapse">
            <thead>
              <tr className="text-left text-xs font-semibold text-slate-500 uppercase">
                <th className="sticky left-0 z-10 bg-slate-50 border-b border-r border-slate-200 px-3 py-2 min-w-[200px]">Employee</th>
                {days.map((d) => (
                  <th
                    key={d}
                    className={`border-b border-slate-200 text-center w-9 px-0 py-2 ${isToday(d) ? "bg-blue-50 text-blue-700" : isWeekend(d) ? "bg-slate-50" : "bg-slate-50"}`}
                  >
                    {d}
                  </th>
                ))}
                <th className="border-b border-l border-slate-200 px-3 py-2 text-center bg-slate-50 min-w-[70px]">P</th>
                <th className="border-b border-slate-200 px-3 py-2 text-center bg-slate-50 min-w-[70px]">A</th>
              </tr>
            </thead>
            <tbody>
              {grid?.employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50/60">
                  <td className="sticky left-0 z-10 bg-white border-r border-b border-slate-100 px-3 py-2">
                    <div className="font-semibold text-slate-800 truncate max-w-[180px]">{emp.fullName}</div>
                    <div className="text-xs text-slate-400">{emp.employeeCode}{emp.department ? ` · ${emp.department}` : ""}</div>
                  </td>
                  {days.map((d) => {
                    const key = dateKey(d);
                    const status = emp.days[key];
                    const variant = status ?? (isWeekend(d) ? "Weekend" : "Unmarked");
                    return (
                      <td key={d} className="border-b border-slate-100 text-center p-0.5">
                        <button
                          type="button"
                          onClick={() => cellClick(emp.id, d)}
                          className={`w-7 h-7 rounded-md text-[10px] font-bold flex items-center justify-center mx-auto transition-colors ${CELL_STYLES[variant]} ${isToday(d) ? "ring-2 ring-blue-400" : ""}`}
                          title={`${emp.fullName} — ${MONTH_NAMES[month - 1]} ${d}: ${status ?? "Unmarked"}`}
                        >
                          {status ? status[0] : ""}
                        </button>
                      </td>
                    );
                  })}
                  <td className="border-b border-l border-slate-100 text-center font-semibold text-emerald-600">{emp.presentCount}</td>
                  <td className="border-b border-slate-100 text-center font-semibold text-rose-600">{emp.absentCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && grid?.employees.length === 0 && (
          <p className="text-center py-10 text-sm text-slate-500">No active employees match this search.</p>
        )}
        {loading && <p className="text-center py-10 text-sm text-slate-500">Loading…</p>}
      </div>

      <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500 inline-block" /> Present</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-rose-500 inline-block" /> Absent</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-100 border border-slate-200 inline-block" /> Unmarked</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-50 border border-slate-200 inline-block" /> Sunday</span>
        <span>Click any cell to cycle: Unmarked → Present → Absent → Unmarked.</span>
      </div>
    </AdminShell>
  );
}
