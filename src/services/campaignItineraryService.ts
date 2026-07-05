import { prisma } from "@/lib/prisma";
import type { Paginated } from "@/types/admin";
import type { Prisma } from "@/generated/prisma/client";

export interface ListQuery {
  search?: string;
  page?: number;
  pageSize?: number;
  filter?: Prisma.ItineraryWhereInput;
}

export async function listItineraries(query: ListQuery = {}) {
  const { search = "", page = 1, pageSize = 10, filter = {} } = query;

  const where: Prisma.ItineraryWhereInput = { isDeleted: false, ...filter };

  if (search.trim()) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { overview: { contains: search, mode: "insensitive" } },
    ];
  }

  const total = await prisma.itinerary.count({ where });
  const items = await prisma.itinerary.findMany({
    where,
    orderBy: { createdDate: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return { items, total, page, pageSize } satisfies Paginated<(typeof items)[number]>;
}

export async function getItinerary(id: string) {
  return prisma.itinerary.findUnique({ where: { id } });
}

export async function findItineraryByPackageId(packageId: string) {
  return prisma.itinerary.findFirst({ where: { packageId, isDeleted: false } });
}

export async function createItinerary(payload: Prisma.ItineraryUncheckedCreateInput) {
  return prisma.itinerary.create({ data: payload });
}

export async function updateItinerary(id: string, payload: Prisma.ItineraryUncheckedUpdateInput) {
  return prisma.itinerary.update({ where: { id }, data: payload });
}

export async function removeItinerary(id: string) {
  return prisma.itinerary.update({ where: { id }, data: { isDeleted: true } });
}

export async function toggleItineraryStatus(id: string) {
  const current = await prisma.itinerary.findUnique({ where: { id } });
  if (!current) return null;
  const next = current.status === "Active" ? "Inactive" : "Active";
  return prisma.itinerary.update({ where: { id }, data: { status: next } });
}
