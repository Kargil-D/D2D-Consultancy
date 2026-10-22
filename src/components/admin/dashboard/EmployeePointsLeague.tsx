"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, BarChart3, Crown, Minus, Rocket, Table2, Trophy, UserRound } from "lucide-react";
import { CATEGORICAL, CHART_INK, STATUS } from "@/components/admin/dashboard/dashboardColors";
import { useAuth } from "@/contexts/AuthContext";
import { dashboardApi } from "@/lib/adminApi";
import type { AdminEmployeePoints } from "@/types/admin";

type Row = AdminEmployeePoints["rows"][number];

const ACCENT = CATEGORICAL[0];
/** De-emphasis gray for everyone-but-you bars (emphasis form). Low contrast by design, so every bar
 * also carries a visible value label and the table view — the palette validator's "relief" rule. */
const DEEMPHASIS = CHART_INK.baseline;
const DELTA_UP_TEXT = "#006300";

const istNow = () => new Date(Date.now() + 5.5 * 60 * 60 * 1000);

/** Last 12 months, newest first, as YYYY-MM in India time. */
function recentMonths(): string[] {
  const now = istNow();
  return Array.from({ length: 12 }, (_, i) => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1)).toISOString().slice(0, 7));
}

function monthLabel(month: string, style: "long" | "short" = "long") {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-IN", { month: style, year: style === "long" ? "numeric" : undefined, timeZone: "UTC" });
}

const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?";
const pts = (n: number) => `${n.toLocaleString("en-IN")} pt${n === 1 ? "" : "s"}`;

/** Signed movement vs last month — always icon + sign + text, never color alone. */
function Delta({ now, prev, prevLabel, compact = false }: { now: number; prev: number; prevLabel: string; compact?: boolean }) {
  const d = now - prev;
  if (d === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-slate-400" aria-label={`No change vs ${prevLabel}`}>
        <Minus className="w-3 h-3" />{compact ? "0" : "No change"}
      </span>
    );
  }
  const up = d > 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className="inline-flex items-center gap-0.5 text-xs font-semibold whitespace-nowrap"
      style={{ color: up ? DELTA_UP_TEXT : STATUS.critical }}
      aria-label={`${up ? "Up" : "Down"} ${Math.abs(d)} points vs ${prevLabel}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {up ? "+" : "−"}{Math.abs(d).toLocaleString("en-IN")}{compact ? "" : ` vs ${prevLabel}`}
    </span>
  );
}

function Tile({ icon: Icon, label, children }: { icon: typeof Trophy; label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 min-w-0">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
        <Icon className="w-3.5 h-3.5" /> {label}
      </div>
      <div className="mt-2 min-w-0">{children}</div>
    </div>
  );
}

const PODIUM_STEP = { 1: "h-24", 2: "h-16", 3: "h-11" } as const;

/** Top three, arranged 2 · 1 · 3 like a real podium. Pedestal height shows *rank* (the number on it
 * says so); the actual points are printed above each name. */
function Podium({ top, meId }: { top: Row[]; meId?: string }) {
  const slots = [top[1], top[0], top[2]].map((row, i) => ({ row, rank: ([2, 1, 3] as const)[i] }));
  return (
    <div className="flex items-end justify-center gap-2 sm:gap-3 h-full pt-2">
      {slots.map(({ row, rank }) => (
        <div key={rank} className="flex-1 max-w-[140px] flex flex-col items-center text-center min-w-0">
          {row ? (
            <>
              <div className="relative">
                {rank === 1 && <Crown className="absolute -top-5 left-1/2 -translate-x-1/2 w-5 h-5 text-slate-700" aria-hidden />}
                <div
                  className={`rounded-full flex items-center justify-center font-bold text-white ${rank === 1 ? "w-14 h-14 text-base" : "w-11 h-11 text-sm"}`}
                  style={{ backgroundColor: row.userId === meId || !meId ? ACCENT : "#52514e", boxShadow: "0 0 0 2px #fff" }}
                >
                  {initials(row.name)}
                </div>
              </div>
              <div className="mt-2 text-xs font-semibold text-slate-800 truncate w-full" title={row.name}>
                {row.name}{row.userId === meId ? " (You)" : ""}
              </div>
              <div className="text-sm font-bold text-slate-900">{pts(row.points)}</div>
            </>
          ) : (
            <div className="text-xs text-slate-300 pb-2">—</div>
          )}
          <div
            className={`mt-2 w-full rounded-t-lg flex items-start justify-center pt-1.5 text-sm font-bold ${PODIUM_STEP[rank]} ${rank === 1 ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-500"}`}
            aria-label={`Rank ${rank}`}
          >
            {rank === 1 ? "1st" : rank === 2 ? "2nd" : "3rd"}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Ranked horizontal bars — one hue; "you" in the accent, everyone else de-emphasized gray. */
function LeagueBars({ rows, meId, prevLabel }: { rows: Row[]; meId?: string; prevLabel: string }) {
  const [active, setActive] = useState<string | null>(null);
  const max = Math.max(1, ...rows.map((r) => r.points));
  const emphasize = !!meId && rows.some((r) => r.userId === meId);

  return (
    <ol className="space-y-1" aria-label="Employee points ranking">
      {rows.map((r, i) => {
        const isMe = r.userId === meId;
        const color = !emphasize || isMe ? ACCENT : DEEMPHASIS;
        const showTip = active === r.userId;
        return (
          <li
            key={r.userId}
            tabIndex={0}
            onMouseEnter={() => setActive(r.userId)}
            onMouseLeave={() => setActive((a) => (a === r.userId ? null : a))}
            onFocus={() => setActive(r.userId)}
            onBlur={() => setActive((a) => (a === r.userId ? null : a))}
            className={`relative grid grid-cols-[1.75rem_minmax(0,9rem)_1fr_auto] sm:grid-cols-[2rem_minmax(0,11rem)_1fr_auto] items-center gap-2 sm:gap-3 rounded-lg px-2 py-1.5 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${isMe ? "bg-blue-50/70" : "hover:bg-slate-50"}`}
          >
            <span className="text-xs font-bold text-slate-400 tabular-nums">#{i + 1}</span>
            <span className="flex items-center gap-1.5 min-w-0">
              <span className="text-sm font-medium text-slate-800 truncate" title={r.name}>{r.name}</span>
              {isMe && <span className="shrink-0 rounded-full bg-blue-600 px-1.5 py-px text-[10px] font-bold text-white">YOU</span>}
            </span>
            {/* Bar grows from the left baseline; 4px rounded data-end, square at the baseline; value at the tip. */}
            <span className="flex items-center gap-2 min-w-0">
              <span
                className="h-2.5 rounded-r-[4px] shrink-0 transition-[width] duration-500"
                style={{ width: r.points > 0 ? `max(4px, calc(${(r.points / max) * 100}% - 4.5rem))` : "0px", backgroundColor: color }}
              />
              <span className="text-sm font-semibold text-slate-900 tabular-nums whitespace-nowrap">{pts(r.points)}</span>
            </span>
            <Delta now={r.points} prev={r.prevPoints} prevLabel={prevLabel} compact />
            {showTip && (
              <span
                role="tooltip"
                className="pointer-events-none absolute right-2 -top-1 -translate-y-full z-10 rounded-lg bg-slate-900 px-3 py-2 text-left shadow-lg"
              >
                <span className="block text-sm font-bold text-white">{pts(r.points)}</span>
                <span className="block text-xs text-slate-300">
                  {r.name} · {r.bookings} booking{r.bookings === 1 ? "" : "s"} · {prevLabel}: {pts(r.prevPoints)}
                </span>
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function LeagueTable({ rows, meId, prevLabel }: { rows: Row[]; meId?: string; prevLabel: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[480px]">
        <thead>
          <tr className="text-left text-[11px] font-semibold text-slate-500 uppercase border-b border-slate-100">
            <th className="px-2 py-2">Rank</th>
            <th className="px-2 py-2">Employee</th>
            <th className="px-2 py-2 text-right">Bookings</th>
            <th className="px-2 py-2 text-right">Points</th>
            <th className="px-2 py-2 text-right">{prevLabel}</th>
            <th className="px-2 py-2 text-right">Change</th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {rows.map((r, i) => (
            <tr key={r.userId} className={`border-b border-slate-50 last:border-0 ${r.userId === meId ? "bg-blue-50/70" : ""}`}>
              <td className="px-2 py-2 text-slate-500">#{i + 1}</td>
              <td className="px-2 py-2 font-medium text-slate-800">{r.name}{r.userId === meId ? " (You)" : ""}</td>
              <td className="px-2 py-2 text-right text-slate-700">{r.bookings}</td>
              <td className="px-2 py-2 text-right font-semibold text-slate-900">{r.points.toLocaleString("en-IN")}</td>
              <td className="px-2 py-2 text-right text-slate-500">{r.prevPoints.toLocaleString("en-IN")}</td>
              <td className="px-2 py-2 text-right"><Delta now={r.points} prev={r.prevPoints} prevLabel={prevLabel} compact /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Dashboard "Employee Points League": 1 point per ₹500 of booking margin, credited to the
 * quotation's Sales Executive, for bookings created in the selected month. Visible to all staff;
 * shows points only, never rupee margins.
 */
export default function EmployeePointsLeague() {
  const { user } = useAuth();
  const months = useMemo(recentMonths, []);
  const [month, setMonth] = useState(months[0]);
  const [view, setView] = useState<"chart" | "table">("chart");
  const [data, setData] = useState<AdminEmployeePoints | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    dashboardApi
      .points(month)
      .then((res) => {
        if (cancelled) return;
        if (res.success) {
          setData(res.data);
          setError(null);
        } else setError(res.message || "Unable to load points");
      })
      .catch(() => !cancelled && setError("Unable to load points"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [month]);

  const meId = user?.id;
  const rows = data?.rows ?? [];
  const prevLabel = data ? monthLabel(data.prevMonth, "short") : "last month";
  const teamPoints = rows.reduce((s, r) => s + r.points, 0);
  const teamPrev = rows.reduce((s, r) => s + r.prevPoints, 0);
  const teamBookings = rows.reduce((s, r) => s + r.bookings, 0);
  const leader = rows[0] && rows[0].points > 0 ? rows[0] : null;
  const mostImproved = [...rows].sort((a, b) => b.points - b.prevPoints - (a.points - a.prevPoints))[0];
  const improvedBy = mostImproved ? mostImproved.points - mostImproved.prevPoints : 0;
  const myIndex = rows.findIndex((r) => r.userId === meId);
  const me = myIndex >= 0 ? rows[myIndex] : null;
  const above = myIndex > 0 ? rows[myIndex - 1] : null;
  const podium = rows.filter((r) => r.points > 0).slice(0, 3);

  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-5">
      {/* Header + controls (one row, scoping everything below) */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
          <Trophy className="w-4 h-4 text-slate-500" /> Employee Points League
        </h3>
        <div className="flex items-center gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 bg-white"
            aria-label="Month"
          >
            {months.map((m) => (
              <option key={m} value={m}>{monthLabel(m)}</option>
            ))}
          </select>
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5" role="group" aria-label="View">
            {([["chart", BarChart3, "Chart"], ["table", Table2, "Table"]] as const).map(([key, Icon, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setView(key)}
                aria-pressed={view === key}
                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ${view === key ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}
              >
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-rose-600 py-6 text-center">{error}</p>}

      {!error && !data && <div className="h-64 rounded-xl bg-slate-50 animate-pulse" />}

      {!error && data && (
        // Refetch keeps the frame: the previous month stays on screen, dimmed, until the new one lands.
        <div className={`space-y-5 transition-opacity ${loading ? "opacity-50" : "opacity-100"}`} aria-busy={loading}>
          {/* Headline tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <div className="rounded-xl p-4 text-white bg-gradient-to-br from-blue-600 to-indigo-600 min-w-0">
              <div className="text-xs font-semibold text-blue-100">Team points · {monthLabel(month)}</div>
              <div className="mt-1 text-5xl font-bold leading-none">{teamPoints.toLocaleString("en-IN")}</div>
              <div className="mt-2 flex flex-wrap items-center gap-x-2 text-xs text-blue-100">
                <span>{teamBookings} booking{teamBookings === 1 ? "" : "s"} credited</span>
                <span className="rounded-full bg-white/95 px-1.5 py-px">
                  <Delta now={teamPoints} prev={teamPrev} prevLabel={prevLabel} />
                </span>
              </div>
            </div>

            <Tile icon={Crown} label="Leader">
              {leader ? (
                <>
                  <div className="text-base font-bold text-slate-900 truncate" title={leader.name}>{leader.name}</div>
                  <div className="text-xs text-slate-500">
                    {pts(leader.points)}
                    {rows[1] && rows[1].points < leader.points ? ` · ${pts(leader.points - rows[1].points)} clear of #2` : ""}
                  </div>
                </>
              ) : (
                <div className="text-sm text-slate-400">No points yet this month</div>
              )}
            </Tile>

            <Tile icon={Rocket} label="Most improved">
              {mostImproved && improvedBy > 0 ? (
                <>
                  <div className="text-base font-bold text-slate-900 truncate" title={mostImproved.name}>{mostImproved.name}</div>
                  <Delta now={mostImproved.points} prev={mostImproved.prevPoints} prevLabel={prevLabel} />
                </>
              ) : (
                <div className="text-sm text-slate-400">No one ahead of {prevLabel} yet</div>
              )}
            </Tile>

            <Tile icon={UserRound} label="Your position">
              {me ? (
                <>
                  <div className="text-base font-bold text-slate-900">
                    #{myIndex + 1} <span className="text-sm font-medium text-slate-500">of {rows.length} · {pts(me.points)}</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    {myIndex === 0
                      ? me.points > 0
                        ? "You're leading the team 🎉"
                        : "Close a booking to get on the board"
                      : above
                        ? `${pts(above.points - me.points + 1)} to overtake ${above.name.split(" ")[0]}`
                        : ""}
                  </div>
                </>
              ) : (
                <div className="text-sm text-slate-400">You&apos;re not on this month&apos;s board</div>
              )}
            </Tile>
          </div>

          {teamPoints === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center">
              <Trophy className="w-8 h-8 mx-auto text-slate-300" />
              <p className="mt-2 text-sm font-semibold text-slate-600">No points for {monthLabel(month)} yet</p>
              <p className="text-xs text-slate-400 mt-0.5">Points appear as bookings are created from quotations with a Sales Executive and a margin.</p>
            </div>
          ) : view === "table" ? (
            <LeagueTable rows={rows} meId={meId} prevLabel={prevLabel} />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-6">
              <div className="rounded-xl bg-gradient-to-b from-slate-50 to-white border border-slate-100 px-3 pt-8 min-h-[230px]">
                <Podium top={podium} meId={meId} />
              </div>
              <LeagueBars rows={rows} meId={meId} prevLabel={prevLabel} />
            </div>
          )}

          {data.unassignedBookings > 0 && (
            <p className="text-xs text-slate-400">
              {data.unassignedBookings} booking{data.unassignedBookings === 1 ? "" : "s"} this month {data.unassignedBookings === 1 ? "has" : "have"} no Sales Executive on the quotation and earn{data.unassignedBookings === 1 ? "s" : ""} no points.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
