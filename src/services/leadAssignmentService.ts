import { prisma } from "@/lib/prisma";
import type { LeadAssignmentMethod } from "@/generated/prisma/client";

/** Static default until a per-employee capacity field exists on Employee — flagged, not invented as real data. */
const DEFAULT_CAPACITY = 30;

const todayStr = () => new Date().toISOString().slice(0, 10);
const dayBounds = (date: string) => {
  const start = new Date(`${date}T00:00:00.000Z`);
  const end = new Date(`${date}T23:59:59.999Z`);
  return { start, end };
};

/** The Sales-department team that leads get assigned to — same population salesUsersApi.list("Sales") surfaces elsewhere. */
async function getSalesTeam() {
  return prisma.employee.findMany({
    where: { isDeleted: false, status: "Active", department: "Sales", userId: { not: null } },
    select: { id: true, fullName: true, employeeCode: true, designation: true, userId: true },
    orderBy: { fullName: "asc" },
  });
}

/** Everything the Lead Assignment Board needs in one call: header stats, per-employee workload, unassigned leads, live feed, round-robin pointer, workload donut, and a 7-day trend. */
export async function getBoardData(date: string = todayStr()) {
  const { start, end } = dayBounds(date);
  const team = await getSalesTeam();
  const userIds = team.map((t) => t.userId!).filter(Boolean);

  const [rosterToday, leadCounts, completedCounts, newLeadsToday, unassignedTotal, assignedTotal, reassignedToday, unassignedLeads, feed, allLogsForRoundRobin] =
    await Promise.all([
      prisma.rosterEntry.findMany({ where: { employeeId: { in: team.map((t) => t.id) }, date: start } }),
      prisma.lead.groupBy({ by: ["assignedToId"], where: { isDeleted: false, assignedToId: { in: userIds } }, _count: { _all: true } }),
      prisma.lead.groupBy({ by: ["assignedToId"], where: { isDeleted: false, assignedToId: { in: userIds }, status: "Won" }, _count: { _all: true } }),
      prisma.lead.count({ where: { isDeleted: false, createdDate: { gte: start, lte: end } } }),
      prisma.lead.count({ where: { isDeleted: false, assignedToId: null } }),
      prisma.lead.count({ where: { isDeleted: false, assignedToId: { not: null } } }),
      prisma.leadAssignmentLog.count({ where: { fromUserId: { not: null }, createdDate: { gte: start, lte: end } } }),
      prisma.lead.findMany({
        where: { isDeleted: false, assignedToId: null },
        include: { destination: { select: { name: true } } },
        orderBy: { createdDate: "desc" },
        take: 12,
      }),
      prisma.leadAssignmentLog.findMany({ orderBy: { createdDate: "desc" }, take: 10 }),
      prisma.leadAssignmentLog.findMany({ where: { toUserId: { in: userIds } }, orderBy: { createdDate: "desc" }, take: 200 }),
    ]);

  const rosterByEmployee = new Map(rosterToday.map((r) => [r.employeeId, r.status]));
  const assignedByUser = new Map(leadCounts.map((c) => [c.assignedToId, c._count._all]));
  const completedByUser = new Map(completedCounts.map((c) => [c.assignedToId, c._count._all]));

  const employees = team.map((emp) => {
    const assigned = assignedByUser.get(emp.userId!) ?? 0;
    const completed = completedByUser.get(emp.userId!) ?? 0;
    const pending = Math.max(assigned - completed, 0);
    const rosterStatus = rosterByEmployee.get(emp.id) ?? null;
    const utilization = Math.round((assigned / DEFAULT_CAPACITY) * 100);
    return {
      id: emp.id,
      userId: emp.userId!,
      fullName: emp.fullName,
      employeeCode: emp.employeeCode,
      designation: emp.designation,
      rosterStatus,
      assignedLeads: assigned,
      completedLeads: completed,
      pendingLeads: pending,
      capacity: DEFAULT_CAPACITY,
      utilization,
    };
  });

  const workingToday = employees.filter((e) => e.rosterStatus === "Present").length;
  const onLeaveToday = employees.filter((e) => e.rosterStatus === "Absent").length;

  // Round robin: whoever received the oldest "most recent assignment" goes next.
  const lastAssignedAt = new Map<string, Date>();
  for (const log of allLogsForRoundRobin) {
    if (!lastAssignedAt.has(log.toUserId)) lastAssignedAt.set(log.toUserId, log.createdDate);
  }
  const rotation = [...employees].sort((a, b) => {
    const aTime = lastAssignedAt.get(a.userId)?.getTime() ?? 0;
    const bTime = lastAssignedAt.get(b.userId)?.getTime() ?? 0;
    return aTime - bTime;
  });
  const nextInQueue = rotation[0] ?? null;
  const lastLog = allLogsForRoundRobin.sort((a, b) => b.createdDate.getTime() - a.createdDate.getTime())[0] ?? null;

  const workloadSummary = employees.reduce(
    (acc, e) => {
      if (e.assignedLeads === 0) acc.low += 1;
      else if (e.utilization > 90) acc.high += 1;
      else acc.wellBalanced += 1;
      return acc;
    },
    { wellBalanced: 0, high: 0, low: 0 },
  );

  // Assignment trend: count of assignment events per day for the last 7 days.
  const trendStart = new Date(start);
  trendStart.setUTCDate(trendStart.getUTCDate() - 6);
  const trendLogs = await prisma.leadAssignmentLog.findMany({
    where: { createdDate: { gte: trendStart, lte: end } },
    select: { createdDate: true },
  });
  const trend: { date: string; count: number }[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    trend.push({ date: key, count: trendLogs.filter((l) => l.createdDate.toISOString().slice(0, 10) === key).length });
  }

  return {
    date,
    summary: {
      employeesWorking: workingToday,
      totalEmployees: employees.length,
      newLeadsToday,
      assignedLeads: assignedTotal,
      unassignedLeads: unassignedTotal,
      reassignedToday,
      employeesOnLeave: onLeaveToday,
    },
    employees,
    unassignedLeadsList: unassignedLeads.map((l) => ({
      id: l.id,
      seq: l.seq,
      customerName: l.customerName,
      destinationName: l.destination.name,
      source: l.source,
      createdDate: l.createdDate.toISOString(),
    })),
    feed: feed.map((f) => ({
      id: f.id,
      leadId: f.leadId,
      fromUserName: f.fromUserName,
      toUserName: f.toUserName,
      method: f.method,
      performedBy: f.performedBy,
      createdDate: f.createdDate.toISOString(),
    })),
    roundRobin: nextInQueue
      ? {
          nextEmployeeId: nextInQueue.id,
          nextEmployeeName: nextInQueue.fullName,
          nextEmployeeDesignation: nextInQueue.designation,
          sequence: rotation.findIndex((r) => r.id === nextInQueue.id) + 1,
          total: rotation.length,
          lastAssignedLeadSeq: lastLog ? unassignedLeads.find((u) => u.id === lastLog.leadId)?.seq ?? null : null,
          lastAssignedToName: lastLog?.toUserName ?? null,
          lastAssignedAt: lastLog?.createdDate.toISOString() ?? null,
        }
      : null,
    workloadSummary,
    trend,
  };
}

/**
 * Picks who a brand-new lead should go to: prefer whoever is marked Present on today's
 * Roster (falling back to the whole Sales team if nobody's been marked yet, so leads never
 * sit unassigned just because Roster hasn't been filled in), then round-robins within that
 * pool by whoever's oldest/never-had-an-assignment. Returns null if there's no Sales team.
 */
async function pickRoundRobinAssignee(): Promise<{ employeeId: string; userId: string; fullName: string } | null> {
  const team = await getSalesTeam();
  if (team.length === 0) return null;

  const { start } = dayBounds(todayStr());
  const rosterToday = await prisma.rosterEntry.findMany({
    where: { employeeId: { in: team.map((t) => t.id) }, date: start, status: "Present" },
    select: { employeeId: true },
  });
  const presentIds = new Set(rosterToday.map((r) => r.employeeId));
  const pool = presentIds.size > 0 ? team.filter((t) => presentIds.has(t.id)) : team;

  const userIds = pool.map((t) => t.userId!).filter(Boolean);
  const logs = await prisma.leadAssignmentLog.findMany({
    where: { toUserId: { in: userIds } },
    orderBy: { createdDate: "desc" },
    select: { toUserId: true, createdDate: true },
  });
  const lastAssignedAt = new Map<string, Date>();
  for (const log of logs) {
    if (!lastAssignedAt.has(log.toUserId)) lastAssignedAt.set(log.toUserId, log.createdDate);
  }

  const [next] = [...pool].sort((a, b) => {
    const aTime = lastAssignedAt.get(a.userId!)?.getTime() ?? 0;
    const bTime = lastAssignedAt.get(b.userId!)?.getTime() ?? 0;
    return aTime - bTime;
  });

  return next ? { employeeId: next.id, userId: next.userId!, fullName: next.fullName } : null;
}

/** Auto-assigns a freshly created lead via round robin — used by leadService.createLead whenever no assignee was given. Best-effort: a lead is left unassigned (not failed) if there's no Sales team to assign it to. */
export async function autoAssignLead(leadId: string, performedBy: string = "System (Auto-Assign)") {
  const pick = await pickRoundRobinAssignee();
  if (!pick) return null;
  return assignLead(leadId, pick.userId, performedBy, "RoundRobin");
}

async function nameForUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { firstName: true, lastName: true } });
  return user ? `${user.firstName} ${user.lastName}`.trim() : "Unknown";
}

/** Assigns (or reassigns) one lead and writes the assignment-log row that powers the board's feed/round-robin. */
export async function assignLead(leadId: string, toUserId: string, performedBy: string, method?: LeadAssignmentMethod) {
  return prisma.$transaction(async (tx) => {
    const lead = await tx.lead.findUniqueOrThrow({ where: { id: leadId } });
    const toUserName = await nameForUser(toUserId);
    const fromUserName = lead.assignedToId ? await nameForUser(lead.assignedToId) : null;

    const updated = await tx.lead.update({ where: { id: leadId }, data: { assignedToId: toUserId } });
    await tx.leadAssignmentLog.create({
      data: {
        leadId,
        fromUserId: lead.assignedToId,
        fromUserName,
        toUserId,
        toUserName,
        method: method ?? (lead.assignedToId ? "Reassign" : "Manual"),
        performedBy,
      },
    });
    await tx.leadActivity.create({
      data: {
        leadId,
        message: fromUserName ? `Reassigned from ${fromUserName} to ${toUserName}` : `Assigned to ${toUserName}`,
      },
    });
    return updated;
  });
}

/** Assigns the same target employee to many leads at once — the "Bulk Reassign" quick action. */
export async function bulkAssignLeads(leadIds: string[], toUserId: string, performedBy: string) {
  for (const leadId of leadIds) {
    await assignLead(leadId, toUserId, performedBy, "BulkReassign");
  }
  return { updated: leadIds.length };
}
