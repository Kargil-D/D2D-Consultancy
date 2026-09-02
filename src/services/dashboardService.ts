import { prisma } from "@/lib/prisma";

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** [start, end) of the last `days` days, ending today, plus the equal-length window before it —
 * so every KPI can show a "vs previous period" delta without a second round of date math. */
function windows(days: number) {
  const now = new Date();
  const end = new Date(startOfDay(now).getTime() + DAY_MS); // tomorrow 00:00 — makes "today" inclusive
  const start = new Date(end.getTime() - days * DAY_MS);
  const priorEnd = start;
  const priorStart = new Date(start.getTime() - days * DAY_MS);
  return { start, end, priorStart, priorEnd };
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

/** Buckets a list of `{ createdDate }` rows into one count per day across [start, end). */
function dailyBuckets<T extends { createdDate: Date }>(rows: T[], start: Date, days: number) {
  const counts = Array.from({ length: days }, () => 0);
  for (const r of rows) {
    const dayIndex = Math.floor((startOfDay(r.createdDate).getTime() - start.getTime()) / DAY_MS);
    if (dayIndex >= 0 && dayIndex < days) counts[dayIndex]++;
  }
  return counts.map((count, i) => ({
    date: new Date(start.getTime() + i * DAY_MS).toISOString().slice(0, 10),
    count,
  }));
}

const fullName = (u: { firstName: string; lastName: string } | null | undefined) =>
  u ? `${u.firstName} ${u.lastName}`.trim() : "Unassigned";

/**
 * Everything the admin home dashboard needs in one call. `includeEmployeePerformance` gates the
 * one section (per-salesperson breakdown) that's sensitive enough to keep Admin-only — every
 * other section is safe for any logged-in staff member, same visibility as the department tiles
 * this dashboard sits above.
 */
export async function getDashboardOverview(includeEmployeePerformance: boolean) {
  const TREND_DAYS = 7;
  const trend = windows(TREND_DAYS);

  const [
    leadsThisPeriod, leadsPriorPeriod,
    quotationsThisPeriod, quotationsPriorPeriod,
    bookingsThisPeriod, bookingsPriorPeriod,
    leadsWonThisPeriod, leadsWonPriorPeriod,
    revenueThisPeriod, revenuePriorPeriod,
    leadTrendRows, quotationTrendRows, bookingTrendRows,
    leadsBySource,
    destinationCounts,
    bookingStatusCounts,
    followUpLeads,
    recentLeadActivity,
    recentBookingActivity,
  ] = await Promise.all([
    prisma.lead.count({ where: { isDeleted: false, createdDate: { gte: trend.start, lt: trend.end } } }),
    prisma.lead.count({ where: { isDeleted: false, createdDate: { gte: trend.priorStart, lt: trend.priorEnd } } }),
    prisma.quotation.count({ where: { isDeleted: false, createdDate: { gte: trend.start, lt: trend.end } } }),
    prisma.quotation.count({ where: { isDeleted: false, createdDate: { gte: trend.priorStart, lt: trend.priorEnd } } }),
    prisma.booking.count({ where: { isDeleted: false, createdDate: { gte: trend.start, lt: trend.end } } }),
    prisma.booking.count({ where: { isDeleted: false, createdDate: { gte: trend.priorStart, lt: trend.priorEnd } } }),
    prisma.lead.count({ where: { isDeleted: false, status: "Won", createdDate: { gte: trend.start, lt: trend.end } } }),
    prisma.lead.count({ where: { isDeleted: false, status: "Won", createdDate: { gte: trend.priorStart, lt: trend.priorEnd } } }),
    prisma.booking.aggregate({ _sum: { totalAmount: true }, where: { isDeleted: false, createdDate: { gte: trend.start, lt: trend.end } } }),
    prisma.booking.aggregate({ _sum: { totalAmount: true }, where: { isDeleted: false, createdDate: { gte: trend.priorStart, lt: trend.priorEnd } } }),
    prisma.lead.findMany({ where: { isDeleted: false, createdDate: { gte: trend.start, lt: trend.end } }, select: { createdDate: true } }),
    prisma.quotation.findMany({ where: { isDeleted: false, createdDate: { gte: trend.start, lt: trend.end } }, select: { createdDate: true } }),
    prisma.booking.findMany({ where: { isDeleted: false, createdDate: { gte: trend.start, lt: trend.end } }, select: { createdDate: true } }),
    prisma.lead.groupBy({ by: ["source"], where: { isDeleted: false }, _count: { _all: true } }),
    prisma.lead.groupBy({ by: ["destinationId"], where: { isDeleted: false }, _count: { _all: true } }),
    prisma.booking.groupBy({ by: ["status"], where: { isDeleted: false }, _count: { _all: true } }),
    prisma.lead.findMany({
      where: { isDeleted: false, status: "FollowUp" },
      include: { destination: { select: { name: true } } },
      orderBy: { updatedDate: "asc" },
      take: 5,
    }),
    prisma.leadActivity.findMany({
      include: { lead: { select: { customerName: true } } },
      orderBy: { createdDate: "desc" },
      take: 8,
    }),
    prisma.bookingTimelineEvent.findMany({
      include: { booking: { select: { seq: true, lead: { select: { customerName: true } } } } },
      orderBy: { createdDate: "desc" },
      take: 8,
    }),
  ]);

  const topDestinationCounts = [...destinationCounts].sort((a, b) => b._count._all - a._count._all).slice(0, 5);
  const destinationIds = topDestinationCounts.map((d) => d.destinationId);
  const destinations = destinationIds.length
    ? await prisma.destination.findMany({ where: { id: { in: destinationIds } }, select: { id: true, name: true } })
    : [];
  const destinationNameById = new Map(destinations.map((d) => [d.id, d.name]));
  const maxDestinationCount = Math.max(1, ...topDestinationCounts.map((d) => d._count._all));

  // Bookings by Month — Postgres date_trunc would need a raw query; 6 months of Booking rows is
  // small enough to just bucket in JS like the 7-day trend above.
  const sixMonthsAgo = new Date(startOfDay(new Date()).getTime());
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5, 1);
  const bookingsForMonthly = await prisma.booking.findMany({
    where: { isDeleted: false, createdDate: { gte: sixMonthsAgo } },
    select: { createdDate: true },
  });
  const monthBuckets = new Map<string, number>();
  for (let i = 0; i < 6; i++) {
    const d = new Date(sixMonthsAgo);
    d.setMonth(d.getMonth() + i);
    monthBuckets.set(`${d.getFullYear()}-${d.getMonth()}`, 0);
  }
  for (const b of bookingsForMonthly) {
    const key = `${b.createdDate.getFullYear()}-${b.createdDate.getMonth()}`;
    if (monthBuckets.has(key)) monthBuckets.set(key, (monthBuckets.get(key) ?? 0) + 1);
  }
  const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const bookingsByMonth = [...monthBuckets.entries()].map(([key, count]) => {
    const [, monthIndex] = key.split("-").map(Number);
    return { month: MONTH_LABELS[monthIndex], count };
  });

  const conversionRate = (won: number, total: number) => (total > 0 ? Math.round((won / total) * 1000) / 10 : 0);

  let employeePerformance: {
    userId: string;
    name: string;
    leads: number;
    quotations: number;
    bookings: number;
    conversionRate: number;
  }[] = [];

  if (includeEmployeePerformance) {
    const [leadCounts, wonCounts, quotationCounts, bookingCounts, users] = await Promise.all([
      prisma.lead.groupBy({ by: ["assignedToId"], where: { isDeleted: false, assignedToId: { not: null } }, _count: { _all: true } }),
      prisma.lead.groupBy({ by: ["assignedToId"], where: { isDeleted: false, assignedToId: { not: null }, status: "Won" }, _count: { _all: true } }),
      prisma.quotation.groupBy({ by: ["salesExecutiveId"], where: { isDeleted: false, salesExecutiveId: { not: null } }, _count: { _all: true } }),
      prisma.booking.groupBy({ by: ["bookingExecutiveId"], where: { isDeleted: false, bookingExecutiveId: { not: null } }, _count: { _all: true } }),
      prisma.user.findMany({ where: { isActive: true }, select: { id: true, firstName: true, lastName: true } }),
    ]);

    const leadsByUser = new Map(leadCounts.map((c) => [c.assignedToId, c._count._all]));
    const wonByUser = new Map(wonCounts.map((c) => [c.assignedToId, c._count._all]));
    const quotationsByUser = new Map(quotationCounts.map((c) => [c.salesExecutiveId, c._count._all]));
    const bookingsByUser = new Map(bookingCounts.map((c) => [c.bookingExecutiveId, c._count._all]));

    const relevantUserIds = new Set([...leadsByUser.keys(), ...quotationsByUser.keys(), ...bookingsByUser.keys()].filter((id): id is string => !!id));
    const userById = new Map(users.map((u) => [u.id, u]));

    employeePerformance = [...relevantUserIds]
      .map((userId) => {
        const leads = leadsByUser.get(userId) ?? 0;
        const won = wonByUser.get(userId) ?? 0;
        return {
          userId,
          name: fullName(userById.get(userId)),
          leads,
          quotations: quotationsByUser.get(userId) ?? 0,
          bookings: bookingsByUser.get(userId) ?? 0,
          conversionRate: conversionRate(won, leads),
        };
      })
      .sort((a, b) => b.leads - a.leads)
      .slice(0, 8);
  }

  // Merges two separate audit-trail tables (Lead + Booking each log their own timeline; there's
  // no unified events table) into one feed, tagged so the UI can pick an icon per kind.
  const recentActivity = [
    ...recentLeadActivity.map((a) => ({
      id: a.id,
      kind: "lead" as const,
      message: a.message,
      context: a.lead.customerName,
      createdDate: a.createdDate.toISOString(),
    })),
    ...recentBookingActivity.map((a) => ({
      id: a.id,
      kind: "booking" as const,
      message: a.message,
      context: a.booking.lead.customerName,
      createdDate: a.createdDate.toISOString(),
    })),
  ]
    .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())
    .slice(0, 8);

  return {
    kpis: {
      leads: { value: leadsThisPeriod, changePct: pctChange(leadsThisPeriod, leadsPriorPeriod) },
      quotations: { value: quotationsThisPeriod, changePct: pctChange(quotationsThisPeriod, quotationsPriorPeriod) },
      bookings: { value: bookingsThisPeriod, changePct: pctChange(bookingsThisPeriod, bookingsPriorPeriod) },
      conversionRate: {
        value: conversionRate(leadsWonThisPeriod, leadsThisPeriod),
        changePct: pctChange(conversionRate(leadsWonThisPeriod, leadsThisPeriod), conversionRate(leadsWonPriorPeriod, leadsPriorPeriod)),
      },
      revenue: {
        value: revenueThisPeriod._sum.totalAmount ?? 0,
        changePct: pctChange(revenueThisPeriod._sum.totalAmount ?? 0, revenuePriorPeriod._sum.totalAmount ?? 0),
      },
    },
    trend: {
      days: TREND_DAYS,
      leads: dailyBuckets(leadTrendRows, trend.start, TREND_DAYS),
      quotations: dailyBuckets(quotationTrendRows, trend.start, TREND_DAYS),
      bookings: dailyBuckets(bookingTrendRows, trend.start, TREND_DAYS),
    },
    leadsBySource: leadsBySource
      .map((s) => ({ source: s.source, count: s._count._all }))
      .sort((a, b) => b.count - a.count),
    topDestinations: topDestinationCounts.map((d) => ({
      destinationId: d.destinationId,
      name: destinationNameById.get(d.destinationId) ?? "Unknown",
      count: d._count._all,
      pctOfMax: Math.round((d._count._all / maxDestinationCount) * 100),
    })),
    employeePerformance,
    bookingsByMonth,
    bookingStatus: bookingStatusCounts.map((b) => ({ status: b.status, count: b._count._all })),
    followUps: followUpLeads.map((l) => ({
      id: l.id,
      customerName: l.customerName,
      destinationName: l.destination.name,
      mobile: l.mobile,
      updatedDate: l.updatedDate.toISOString(),
    })),
    recentActivity,
  };
}

export type DashboardOverview = Awaited<ReturnType<typeof getDashboardOverview>>;
