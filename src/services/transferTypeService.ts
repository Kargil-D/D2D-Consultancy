import { prisma } from "@/lib/prisma";
import type { Paginated } from "@/types/admin";
import type { Prisma } from "@/generated/prisma/client";

export interface ListQuery {
  search?: string;
  page?: number;
  pageSize?: number;
  filter?: Prisma.TransferTypeWhereInput;
}

export async function listTransferTypes(query: ListQuery = {}) {
  const { search = "", page = 1, pageSize = 10, filter = {} } = query;

  const where: Prisma.TransferTypeWhereInput = { isDeleted: false, ...filter };

  if (search.trim()) {
    where.name = { contains: search, mode: "insensitive" };
  }

  const total = await prisma.transferType.count({ where });
  const items = await prisma.transferType.findMany({
    where,
    orderBy: { createdDate: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return { items, total, page, pageSize } satisfies Paginated<(typeof items)[number]>;
}

export async function getTransferType(id: string) {
  return prisma.transferType.findUnique({ where: { id } });
}

export async function createTransferType(payload: Prisma.TransferTypeUncheckedCreateInput) {
  return prisma.transferType.create({ data: payload });
}

export async function updateTransferType(id: string, payload: Prisma.TransferTypeUncheckedUpdateInput) {
  return prisma.transferType.update({ where: { id }, data: payload });
}

export async function removeTransferType(id: string) {
  return prisma.transferType.update({ where: { id }, data: { isDeleted: true } });
}

export async function toggleTransferTypeStatus(id: string) {
  const current = await prisma.transferType.findUnique({ where: { id } });
  if (!current) return null;
  const next = current.status === "Active" ? "Inactive" : "Active";
  return prisma.transferType.update({ where: { id }, data: { status: next } });
}
