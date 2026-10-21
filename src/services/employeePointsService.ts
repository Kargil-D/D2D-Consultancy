import { prisma } from "@/lib/prisma";
import { computeQuotationPricing } from "@/lib/quotationPricing";

/** 1 point per ₹500 of booking margin. */
export const POINT_VALUE_INR = 500;

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/** Current month in India time, as "YYYY-MM". */
export function currentIstMonth(): string {
  return new Date(Date.now() + IST_OFFSET_MS).toISOString().slice(0, 7);
}

/** [start, end) instants of a calendar month in India time — so a booking made at 1am IST on the 1st
 * counts in that month, even though it's still the previous day in UTC (the server's clock). */
function istMonthRange(month: string) {
  const [y, m] = month.split("-").map(Number);
  return {
    start: new Date(Date.UTC(y, m - 1, 1) - IST_OFFSET_MS),
    end: new Date(Date.UTC(y, m, 1) - IST_OFFSET_MS),
  };
}

/** "2026-10" → "2026-09" (and "2026-01" → "2025-12"). */
function previousMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 2, 1)).toISOString().slice(0, 7);
}

const toPoints = (margin: number) => Math.floor(Math.max(0, margin) / POINT_VALUE_INR);

/** Margin and booking count per Sales Executive for one month, plus bookings no one gets credit for. */
async function tallyMonth(month: string) {
  const { start, end } = istMonthRange(month);
  const bookings = await prisma.booking.findMany({
    where: { isDeleted: false, status: { not: "Cancelled" }, createdDate: { gte: start, lt: end } },
    select: {
      quotation: {
        select: { salesExecutiveId: true, marginPercent: true, gstPercent: true, items: { select: { qty: true, cost: true } } },
      },
    },
  });

  const margin = new Map<string, number>();
  const count = new Map<string, number>();
  let unassigned = 0;
  for (const b of bookings) {
    const salesExecutiveId = b.quotation?.salesExecutiveId;
    if (!b.quotation || !salesExecutiveId) {
      unassigned++;
      continue;
    }
    margin.set(salesExecutiveId, (margin.get(salesExecutiveId) ?? 0) + computeQuotationPricing(b.quotation).marginValue);
    count.set(salesExecutiveId, (count.get(salesExecutiveId) ?? 0) + 1);
  }
  return { margin, count, unassigned };
}

export interface EmployeePointsRow {
  userId: string;
  name: string;
  bookings: number;
  points: number;
  /** Same employee's points the month before — powers the "vs last month" movement. */
  prevPoints: number;
}

/**
 * Monthly points leaderboard. Each booking created in the month (Cancelled excluded) earns its
 * quotation's margin — the same "Margin" figure on the booking header — for the quotation's Sales
 * Executive; an employee's points are their month's total margin ÷ ₹500, rounded down.
 *
 * Deliberately returns points and booking counts only, never rupee amounts: the leaderboard is visible
 * to all staff, while booking margins themselves stay BookingsMaster-only.
 */
export async function getMonthlyEmployeePoints(month: string) {
  const prevMonth = previousMonth(month);
  const [current, previous, staff] = await Promise.all([
    tallyMonth(month),
    tallyMonth(prevMonth),
    // Every active staff member gets a row (zero points included), so the board shows the whole team.
    prisma.user.findMany({
      where: { isActive: true, role: { name: { not: "Customer" } } },
      select: { id: true, firstName: true, lastName: true },
    }),
  ]);

  // Someone who earned points this month but has since been deactivated still keeps their row.
  const knownIds = new Set(staff.map((u) => u.id));
  const missingIds = [...current.count.keys()].filter((id) => !knownIds.has(id));
  const formerStaff = missingIds.length
    ? await prisma.user.findMany({ where: { id: { in: missingIds } }, select: { id: true, firstName: true, lastName: true } })
    : [];

  const rows: EmployeePointsRow[] = [...staff, ...formerStaff]
    .map((u) => ({
      userId: u.id,
      name: `${u.firstName} ${u.lastName}`.trim(),
      bookings: current.count.get(u.id) ?? 0,
      points: toPoints(current.margin.get(u.id) ?? 0),
      prevPoints: toPoints(previous.margin.get(u.id) ?? 0),
    }))
    .sort((a, b) => b.points - a.points || b.bookings - a.bookings || a.name.localeCompare(b.name));

  return { month, prevMonth, pointValueInr: POINT_VALUE_INR, rows, unassignedBookings: current.unassigned };
}
