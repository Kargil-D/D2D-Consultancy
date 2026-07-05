import { prisma } from "@/lib/prisma";
import type { Paginated } from "@/types/admin";
import type { Prisma } from "@/generated/prisma/client";

export interface ListQuery {
  page?: number;
  pageSize?: number;
  filter?: Prisma.TransferWhereInput;
}

export async function listTransfers(query: ListQuery = {}) {
  const { page = 1, pageSize = 10, filter = {} } = query;

  const where: Prisma.TransferWhereInput = { isDeleted: false, ...filter };

  const total = await prisma.transfer.count({ where });
  const items = await prisma.transfer.findMany({
    where,
    orderBy: { createdDate: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return { items, total, page, pageSize } satisfies Paginated<(typeof items)[number]>;
}

export async function getTransfer(id: string) {
  return prisma.transfer.findUnique({ where: { id } });
}

export async function findTransferByPackageId(packageId: string) {
  return prisma.transfer.findFirst({ where: { packageId, isDeleted: false } });
}

export async function createTransfer(payload: Prisma.TransferUncheckedCreateInput) {
  return prisma.transfer.create({ data: payload });
}

export async function updateTransfer(id: string, payload: Prisma.TransferUncheckedUpdateInput) {
  return prisma.transfer.update({ where: { id }, data: payload });
}

export async function removeTransfer(id: string) {
  return prisma.transfer.update({ where: { id }, data: { isDeleted: true } });
}

export async function toggleTransferStatus(id: string) {
  const current = await prisma.transfer.findUnique({ where: { id } });
  if (!current) return null;
  const next = current.status === "Active" ? "Inactive" : "Active";
  return prisma.transfer.update({ where: { id }, data: { status: next } });
}
