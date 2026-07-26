"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Users2, UserPlus2, ClipboardCheck, Clock, Shuffle, CalendarOff,
  Plus, RefreshCw, Layers, ArrowRight, Radio,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import Breadcrumb from "@/components/admin/ui/Breadcrumb";
import Drawer from "@/components/admin/ui/Drawer";
import { useToast } from "@/components/admin/ui/Toast";
import { leadAssignmentApi } from "@/lib/adminApi";
import type { AdminLeadBoard } from "@/types/admin";

const todayStr = () => new Date().toISOString().slice(0, 10);

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const STATUS_DOT: Record<string, string> = {
  Present: "bg-emerald-500",
  Absent: "bg-rose-500",
};

export default function LeadAssignmentBoardPage() {
  const { notify } = useToast();
  const [board, setBoard] = useState<AdminLeadBoard | null>(null);
  const [loading, setLoading] = useState(true);
  const [reassignOpen, setReassignOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [reassignLeadId, setReassignLeadId] = useState("");
  const [reassignToUserId, setReassignToUserId] = useState("");
  const [bulkLeadIds, setBulkLeadIds] = useState<string[]>([]);
  const [bulkToUserId, setBulkToUserId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await leadAssignmentApi.board(todayStr());
    if (res.success) setBoard(res.data);
    else notify(res.message || "Unable to load the board", "error");
    setLoading(false);
  }, [notify]);

  useEffect(() => {
    load();
  }, [load]);

  const assignOne = async (leadId: string, toUserId: string) => {
    const res = await leadAssignmentApi.assign(leadId, toUserId);
    if (!res.success) return notify(res.message || "Unable to assign lead", "error");
    notify("Lead assigned", "success");
    load();
  };

  const submitReassign = async () => {
    if (!reassignLeadId || !reassignToUserId) return;
    setSubmitting(true);
    try {
      const res = await leadAssignmentApi.assign(reassignLeadId, reassignToUserId);
      if (!res.success) return notify(res.message || "Unable to reassign lead", "error");
      notify("Lead reassigned", "success");
      setReassignOpen(false);
      setReassignLeadId("");
      setReassignToUserId("");
      load();
    } finally {
      setSubmitting(false);
    }
  };

  const submitBulk = async () => {
    if (bulkLeadIds.length === 0 || !bulkToUserId) return;
    setSubmitting(true);
    try {
      const res = await leadAssignmentApi.bulkAssign(bulkLeadIds, bulkToUserId);
      if (!res.success) return notify(res.message || "Unable to bulk assign", "error");
      notify(res.message || "Assigned", "success");
      setBulkOpen(false);
      setBulkLeadIds([]);
      setBulkToUserId("");
      load();
    } finally {
      setSubmitting(false);
    }
  };

  const trendPoints = useMemo(() => {
    if (!board) return "";
    const max = Math.max(1, ...board.trend.map((t) => t.count));
    const w = 100 / Math.max(1, board.trend.length - 1);
    return board.trend
      .map((t, i) => `${i * w},${40 - (t.count / max) * 36}`)
      .join(" ");
  }, [board]);

  const donut = useMemo(() => {
    if (!board) return { wellBalanced: 0, high: 0, low: 0, total: 0 };
    const { wellBalanced, high, low } = board.workloadSummary;
    return { wellBalanced, high, low, total: wellBalanced + high + low || 1 };
  }, [board]);

  const donutGradient = board
    ? (() => {
        const wPct = (donut.wellBalanced / donut.total) * 360;
        const hPct = (donut.high / donut.total) * 360;
        return `conic-gradient(#10b981 0deg ${wPct}deg, #f59e0b ${wPct}deg ${wPct + hPct}deg, #6366f1 ${wPct + hPct}deg 360deg)`;
      })()
    : "";

  const STAT_CARDS = board
    ? [
        { label: "Employees Working", value: `${board.summary.employeesWorking} / ${board.summary.totalEmployees}`, icon: Users2, tone: "bg-indigo-50 text-indigo-700 border-indigo-200" },
        { label: "New Leads Today", value: String(board.summary.newLeadsToday), icon: UserPlus2, tone: "bg-emerald-50 text-emerald-700 border-emerald-200" },
        { label: "Assigned Leads", value: String(board.summary.assignedLeads), icon: ClipboardCheck, tone: "bg-blue-50 text-blue-700 border-blue-200" },
        { label: "Unassigned Leads", value: String(board.summary.unassignedLeads), icon: Clock, tone: "bg-amber-50 text-amber-700 border-amber-200" },
        { label: "Reassigned Today", value: String(board.summary.reassignedToday), icon: Shuffle, tone: "bg-purple-50 text-purple-700 border-purple-200" },
        { label: "Employees on Leave", value: String(board.summary.employeesOnLeave), icon: CalendarOff, tone: "bg-rose-50 text-rose-700 border-rose-200" },
      ]
    : [];

  return (
    <AdminShell title="Lead Assignment">
      <Breadcrumb items={[{ label: "Locker", href: "/admin/locker" }, { label: "Lead Assignment" }]} />
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lead Assignment Board</h1>
          <p className="text-sm text-slate-500 mt-0.5">Monitor and manage lead distribution across your Sales team — {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
        </div>
        <button type="button" onClick={load} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {STAT_CARDS.map((c) => (
          <div key={c.label} className={`rounded-xl border p-4 ${c.tone}`}>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider opacity-80">
              <c.icon className="w-3.5 h-3.5" /> {c.label}
            </div>
            <div className="text-2xl font-bold mt-1">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
        <div className="space-y-6">
          {/* Team workload */}
          <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 font-bold text-slate-900 text-sm">Team Workload Overview</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold text-slate-500 uppercase bg-slate-50">
                    <th className="px-4 py-2.5">Employee</th>
                    <th className="px-4 py-2.5">Today</th>
                    <th className="px-4 py-2.5 text-center">Assigned</th>
                    <th className="px-4 py-2.5 text-center">Completed</th>
                    <th className="px-4 py-2.5 text-center">Pending</th>
                    <th className="px-4 py-2.5">Utilization</th>
                  </tr>
                </thead>
                <tbody>
                  {board?.employees.map((e) => (
                    <tr key={e.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                            {e.fullName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800">{e.fullName}</div>
                            <div className="text-xs text-slate-400">{e.designation || e.employeeCode}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {e.rosterStatus ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                            <span className={`w-2 h-2 rounded-full ${STATUS_DOT[e.rosterStatus]}`} /> {e.rosterStatus}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Unmarked</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-slate-800">{e.assignedLeads}</td>
                      <td className="px-4 py-3 text-center text-emerald-600 font-semibold">{e.completedLeads}</td>
                      <td className="px-4 py-3 text-center text-amber-600 font-semibold">{e.pendingLeads}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 min-w-[120px]">
                          <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${e.utilization > 90 ? "bg-amber-500" : e.utilization === 0 ? "bg-slate-300" : "bg-emerald-500"}`}
                              style={{ width: `${Math.min(100, e.utilization)}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-slate-500 w-9 text-right">{e.utilization}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!loading && board?.employees.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-8 text-sm text-slate-500">No active Sales-department employees found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Unassigned leads + trend */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl bg-white border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-900 text-sm">Unassigned Leads ({board?.summary.unassignedLeads ?? 0})</h3>
                <Link href="/admin/leads" className="text-xs font-medium text-blue-600 hover:underline">View All</Link>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {board?.unassignedLeadsList.map((l) => (
                  <div key={l.id} className="flex items-center justify-between gap-2 border border-slate-100 rounded-lg px-3 py-2">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-800 truncate">{l.customerName}</div>
                      <div className="text-xs text-slate-400">{l.destinationName} · {l.source}</div>
                    </div>
                    <select
                      className="text-xs border border-slate-200 rounded-md px-2 py-1.5 flex-shrink-0"
                      defaultValue=""
                      onChange={(e) => { if (e.target.value) assignOne(l.id, e.target.value); }}
                    >
                      <option value="" disabled>Assign…</option>
                      {board.employees.map((e) => (
                        <option key={e.userId} value={e.userId}>{e.fullName}</option>
                      ))}
                    </select>
                  </div>
                ))}
                {!loading && board?.unassignedLeadsList.length === 0 && (
                  <p className="text-center py-6 text-sm text-slate-500">All caught up — no unassigned leads.</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 p-5">
              <h3 className="font-bold text-slate-900 text-sm mb-3">Assignment Trend (7 days)</h3>
              {board && (
                <svg viewBox="0 0 100 44" preserveAspectRatio="none" className="w-full h-32">
                  <polyline points={trendPoints} fill="none" stroke="#6366f1" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                  {board.trend.map((t, i) => {
                    const max = Math.max(1, ...board.trend.map((x) => x.count));
                    const w = 100 / Math.max(1, board.trend.length - 1);
                    return <circle key={t.date} cx={i * w} cy={40 - (t.count / max) * 36} r="1.4" fill="#6366f1" />;
                  })}
                </svg>
              )}
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                {board?.trend.map((t) => (
                  <span key={t.date}>{new Date(t.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right rail */}
        <div className="space-y-6">
          <div className="rounded-2xl bg-white border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5"><Radio className="w-3.5 h-3.5 text-rose-500" /> Live Assignment Feed</h3>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {board?.feed.map((f) => (
                <div key={f.id} className="flex items-start gap-2 text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <span className="text-slate-400">{timeAgo(f.createdDate)}</span>{" "}
                    {f.fromUserName ? (
                      <span className="text-slate-700">{f.fromUserName} <ArrowRight className="w-2.5 h-2.5 inline mx-0.5" /> {f.toUserName}</span>
                    ) : (
                      <span className="text-slate-700">Assigned to {f.toUserName}</span>
                    )}
                    <div className="text-slate-400">by {f.performedBy} · {f.method}</div>
                  </div>
                </div>
              ))}
              {!loading && board?.feed.length === 0 && <p className="text-xs text-slate-400">No assignment activity yet.</p>}
            </div>
          </div>

          {board?.roundRobin && (
            <div className="rounded-2xl bg-white border border-slate-200 p-5">
              <h3 className="font-bold text-slate-900 text-sm mb-3">Round Robin Status</h3>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-400">Next in Queue</span>
                <span className="text-xs text-slate-400">Sequence</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 text-white text-xs font-bold flex items-center justify-center">
                    {board.roundRobin.nextEmployeeName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-800">{board.roundRobin.nextEmployeeName}</div>
                    <div className="text-xs text-slate-400">{board.roundRobin.nextEmployeeDesignation}</div>
                  </div>
                </div>
                <span className="text-sm font-bold text-slate-700">{board.roundRobin.sequence} of {board.roundRobin.total}</span>
              </div>
              {board.roundRobin.lastAssignedToName && (
                <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                  Last assigned to <span className="font-semibold text-slate-700">{board.roundRobin.lastAssignedToName}</span>
                  {board.roundRobin.lastAssignedLeadSeq && ` · Lead #LD${1800 + board.roundRobin.lastAssignedLeadSeq}`}
                  {board.roundRobin.lastAssignedAt && ` · ${timeAgo(board.roundRobin.lastAssignedAt)}`}
                </div>
              )}
            </div>
          )}

          <div className="rounded-2xl bg-white border border-slate-200 p-5">
            <h3 className="font-bold text-slate-900 text-sm mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setReassignOpen(true)} className="flex flex-col items-center gap-1.5 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700">
                <Shuffle className="w-4 h-4 text-indigo-600" /> Reassign Lead
              </button>
              <button type="button" onClick={() => setBulkOpen(true)} className="flex flex-col items-center gap-1.5 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700">
                <Layers className="w-4 h-4 text-emerald-600" /> Bulk Reassign
              </button>
              <Link href="/admin/leads/new" className="flex flex-col items-center gap-1.5 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700">
                <Plus className="w-4 h-4 text-blue-600" /> Add Lead
              </Link>
              <div className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl bg-slate-50" style={{ backgroundImage: donutGradient ? undefined : undefined }}>
                <div className="relative w-10 h-10 rounded-full" style={{ background: donutGradient }}>
                  <div className="absolute inset-1.5 rounded-full bg-white" />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 p-5">
            <h3 className="font-bold text-slate-900 text-sm mb-4">Workload Summary</h3>
            <div className="flex items-center gap-5">
              <div className="relative w-24 h-24 rounded-full flex-shrink-0" style={{ background: donutGradient }}>
                <div className="absolute inset-3 rounded-full bg-white flex flex-col items-center justify-center">
                  <span className="text-lg font-bold text-slate-900">{board?.summary.totalEmployees ?? 0}</span>
                  <span className="text-[9px] text-slate-400">Employees</span>
                </div>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Well Balanced ({donut.wellBalanced})</div>
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> High Workload ({donut.high})</div>
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Low Workload ({donut.low})</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reassign Lead drawer */}
      <Drawer
        open={reassignOpen}
        title="Reassign Lead"
        onClose={() => setReassignOpen(false)}
        footer={
          <>
            <button type="button" onClick={() => setReassignOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">Cancel</button>
            <button type="button" onClick={submitReassign} disabled={submitting || !reassignLeadId || !reassignToUserId} className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40">
              {submitting ? "Reassigning…" : "Reassign"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Lead</label>
            <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={reassignLeadId} onChange={(e) => setReassignLeadId(e.target.value)}>
              <option value="">Select a lead…</option>
              {board?.unassignedLeadsList.map((l) => (
                <option key={l.id} value={l.id}>{l.customerName} — {l.destinationName}</option>
              ))}
            </select>
            <p className="text-xs text-slate-400 mt-1">Showing currently unassigned leads. To move an already-assigned lead, open it from the Leads list.</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Assign to</label>
            <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={reassignToUserId} onChange={(e) => setReassignToUserId(e.target.value)}>
              <option value="">Select team member…</option>
              {board?.employees.map((e) => (
                <option key={e.userId} value={e.userId}>{e.fullName} ({e.assignedLeads} active)</option>
              ))}
            </select>
          </div>
        </div>
      </Drawer>

      {/* Bulk Reassign drawer */}
      <Drawer
        open={bulkOpen}
        title="Bulk Reassign"
        onClose={() => setBulkOpen(false)}
        footer={
          <>
            <button type="button" onClick={() => setBulkOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">Cancel</button>
            <button type="button" onClick={submitBulk} disabled={submitting || bulkLeadIds.length === 0 || !bulkToUserId} className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40">
              {submitting ? "Assigning…" : `Assign ${bulkLeadIds.length || ""}`}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Leads</label>
            <div className="border border-slate-200 rounded-lg max-h-56 overflow-y-auto divide-y divide-slate-100">
              {board?.unassignedLeadsList.map((l) => (
                <label key={l.id} className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={bulkLeadIds.includes(l.id)}
                    onChange={(e) => setBulkLeadIds((prev) => (e.target.checked ? [...prev, l.id] : prev.filter((id) => id !== l.id)))}
                  />
                  <span className="flex-1">{l.customerName} — {l.destinationName}</span>
                  <span className="text-xs text-slate-400">{l.source}</span>
                </label>
              ))}
              {board?.unassignedLeadsList.length === 0 && <p className="text-center py-6 text-sm text-slate-500">No unassigned leads to bulk assign.</p>}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Assign to</label>
            <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={bulkToUserId} onChange={(e) => setBulkToUserId(e.target.value)}>
              <option value="">Select team member…</option>
              {board?.employees.map((e) => (
                <option key={e.userId} value={e.userId}>{e.fullName} ({e.assignedLeads} active)</option>
              ))}
            </select>
          </div>
        </div>
      </Drawer>
    </AdminShell>
  );
}
