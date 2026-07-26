import { prisma } from "@/lib/prisma";
import type { RosterStatus } from "@/generated/prisma/client";

function monthRange(year: number, month: number) {
  // month is 1-12
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0)); // last day of the month
  return { start, end, daysInMonth: end.getUTCDate() };
}

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

export interface RosterGridFilter {
  department?: string;
  search?: string;
}

/** One row per Active employee for the given month, with a date->status map and a monthly Present/Absent tally. Powers the Admin Roster grid. */
export async function getRosterGrid(year: number, month: number, filter: RosterGridFilter = {}) {
  const { start, end, daysInMonth } = monthRange(year, month);

  const employees = await prisma.employee.findMany({
    where: {
      isDeleted: false,
      status: "Active",
      ...(filter.department ? { department: filter.department } : {}),
      ...(filter.search
        ? { OR: [{ fullName: { contains: filter.search, mode: "insensitive" } }, { employeeCode: { contains: filter.search, mode: "insensitive" } }] }
        : {}),
    },
    select: { id: true, fullName: true, employeeCode: true, designation: true, department: true },
    orderBy: { fullName: "asc" },
  });

  const entries = await prisma.rosterEntry.findMany({
    where: { employeeId: { in: employees.map((e) => e.id) }, date: { gte: start, lte: end } },
  });

  const byEmployee = new Map<string, Record<string, RosterStatus>>();
  for (const e of entries) {
    const map = byEmployee.get(e.employeeId) ?? {};
    map[dayKey(e.date)] = e.status;
    byEmployee.set(e.employeeId, map);
  }

  const rows = employees.map((emp) => {
    const days = byEmployee.get(emp.id) ?? {};
    const presentCount = Object.values(days).filter((s) => s === "Present").length;
    const absentCount = Object.values(days).filter((s) => s === "Absent").length;
    return { ...emp, days, presentCount, absentCount };
  });

  const summary = rows.reduce(
    (acc, r) => ({ present: acc.present + r.presentCount, absent: acc.absent + r.absentCount }),
    { present: 0, absent: 0 },
  );

  return { year, month, daysInMonth, employees: rows, summary };
}

/** Sets or clears (status = null) a single day's attendance for one employee. */
export async function markRosterEntry(employeeId: string, date: string, status: RosterStatus | null, markedBy: string) {
  const day = new Date(`${date}T00:00:00.000Z`);
  if (status === null) {
    await prisma.rosterEntry.deleteMany({ where: { employeeId, date: day } });
    return null;
  }
  return prisma.rosterEntry.upsert({
    where: { employeeId_date: { employeeId, date: day } },
    update: { status, markedBy },
    create: { employeeId, date: day, status, markedBy },
  });
}

/** Marks the same status for many employees on one day at once — the "Mark all Present today" quick action. */
export async function bulkMarkRoster(employeeIds: string[], date: string, status: RosterStatus, markedBy: string) {
  const day = new Date(`${date}T00:00:00.000Z`);
  await prisma.$transaction(
    employeeIds.map((employeeId) =>
      prisma.rosterEntry.upsert({
        where: { employeeId_date: { employeeId, date: day } },
        update: { status, markedBy },
        create: { employeeId, date: day, status, markedBy },
      }),
    ),
  );
  return { updated: employeeIds.length };
}

/** Self-view for the "My Roster" page — one employee's own month, date->status map only. */
export async function getMyRoster(employeeId: string, year: number, month: number) {
  const { start, end, daysInMonth } = monthRange(year, month);
  const entries = await prisma.rosterEntry.findMany({ where: { employeeId, date: { gte: start, lte: end } } });
  const days: Record<string, RosterStatus> = {};
  for (const e of entries) days[dayKey(e.date)] = e.status;
  return { year, month, daysInMonth, days };
}
