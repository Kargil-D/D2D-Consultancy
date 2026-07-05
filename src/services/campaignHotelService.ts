import { prisma } from "@/lib/prisma";
import type { Paginated } from "@/types/admin";
import type { Prisma } from "@/generated/prisma/client";

export interface ListQuery {
  page?: number;
  pageSize?: number;
  filter?: Prisma.HotelWhereInput;
}

export async function listHotels(query: ListQuery = {}) {
  const { page = 1, pageSize = 10, filter = {} } = query;

  const where: Prisma.HotelWhereInput = { isDeleted: false, ...filter };

  const total = await prisma.hotel.count({ where });
  const items = await prisma.hotel.findMany({
    where,
    orderBy: { createdDate: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return { items, total, page, pageSize } satisfies Paginated<(typeof items)[number]>;
}

export async function getHotel(id: string) {
  return prisma.hotel.findUnique({ where: { id } });
}

export async function findHotelByPackageId(packageId: string) {
  return prisma.hotel.findFirst({ where: { packageId, isDeleted: false } });
}

export async function createHotel(payload: Prisma.HotelUncheckedCreateInput) {
  return prisma.hotel.create({ data: payload });
}

export async function updateHotel(id: string, payload: Prisma.HotelUncheckedUpdateInput) {
  return prisma.hotel.update({ where: { id }, data: payload });
}

export async function removeHotel(id: string) {
  return prisma.hotel.update({ where: { id }, data: { isDeleted: true } });
}

export async function toggleHotelStatus(id: string) {
  const current = await prisma.hotel.findUnique({ where: { id } });
  if (!current) return null;
  const next = current.status === "Active" ? "Inactive" : "Active";
  return prisma.hotel.update({ where: { id }, data: { status: next } });
}
