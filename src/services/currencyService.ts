import { prisma } from "@/lib/prisma";
import type { Paginated } from "@/types/admin";
import type { Prisma } from "@/generated/prisma/client";

export interface ListQuery {
  search?: string;
  page?: number;
  pageSize?: number;
  filter?: Prisma.CurrencyWhereInput;
}

export async function listCurrencies(query: ListQuery = {}) {
  const { search = "", page = 1, pageSize = 10, filter = {} } = query;
  const where: Prisma.CurrencyWhereInput = { isDeleted: false, ...filter };

  if (search.trim()) {
    where.OR = [
      { code: { contains: search, mode: "insensitive" } },
      { name: { contains: search, mode: "insensitive" } },
    ];
  }

  const total = await prisma.currency.count({ where });
  const items = await prisma.currency.findMany({
    where,
    orderBy: { code: "asc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return { items, total, page, pageSize } satisfies Paginated<(typeof items)[number]>;
}

export function getCurrency(id: string) {
  return prisma.currency.findUnique({ where: { id } });
}

export interface CurrencyInput {
  code: string;
  name: string;
  exchangeRate: number;
  effectiveFrom: string;
  status?: "Active" | "Inactive";
}

export function createCurrency(input: CurrencyInput, updatedBy: string) {
  return prisma.currency.create({
    data: {
      code: input.code,
      name: input.name,
      exchangeRate: input.exchangeRate,
      effectiveFrom: new Date(input.effectiveFrom),
      status: input.status ?? "Active",
      createdBy: updatedBy,
      updatedBy,
    },
  });
}

/** Rate changes are logged to CurrencyRateHistory in the same transaction — every update that actually changes the rate leaves an audit trail. */
export async function updateCurrency(id: string, input: Partial<CurrencyInput>, updatedBy: string) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.currency.findUniqueOrThrow({ where: { id } });

    const rateChanged = input.exchangeRate !== undefined && input.exchangeRate !== current.exchangeRate;

    const updated = await tx.currency.update({
      where: { id },
      data: {
        ...(input.code !== undefined && { code: input.code }),
        ...(input.name !== undefined && { name: input.name }),
        ...(input.exchangeRate !== undefined && { exchangeRate: input.exchangeRate }),
        ...(input.effectiveFrom !== undefined && { effectiveFrom: new Date(input.effectiveFrom) }),
        ...(input.status !== undefined && { status: input.status }),
        updatedBy,
      },
    });

    if (rateChanged) {
      await tx.currencyRateHistory.create({
        data: {
          currencyId: id,
          currencyCode: updated.code,
          oldRate: current.exchangeRate,
          newRate: updated.exchangeRate,
          effectiveFrom: updated.effectiveFrom,
          changedBy: updatedBy,
        },
      });
    }

    return updated;
  });
}

export async function toggleCurrencyStatus(id: string, updatedBy: string) {
  const current = await prisma.currency.findUnique({ where: { id } });
  if (!current) return null;
  const next = current.status === "Active" ? "Inactive" : "Active";
  return prisma.currency.update({ where: { id }, data: { status: next, updatedBy } });
}

export function listRateHistory(currencyId: string) {
  return prisma.currencyRateHistory.findMany({
    where: { currencyId },
    orderBy: { changedDate: "desc" },
  });
}
