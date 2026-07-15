import { prisma } from "@/lib/prisma";
import type { Paginated } from "@/types/admin";
import type { Prisma, Destination as DestinationModel } from "@/generated/prisma/client";

export interface ListQuery {
  search?: string;
  page?: number;
  pageSize?: number;
  filter?: Prisma.DestinationWhereInput;
}

export async function listDestinations(query: ListQuery = {}): Promise<Paginated<DestinationModel>> {
  const { search = "", page = 1, pageSize = 10, filter = {} } = query;

  const where: Prisma.DestinationWhereInput = { isDeleted: false, ...filter };

  if (search.trim()) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { country: { contains: search, mode: "insensitive" } },
      { state: { contains: search, mode: "insensitive" } },
      { city: { contains: search, mode: "insensitive" } },
    ];
  }

  const total = await prisma.destination.count({ where });
  const items = await prisma.destination.findMany({
    where,
    orderBy: { displayOrder: "asc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return { items, total, page, pageSize };
}

export async function getDestination(id: string) {
  return prisma.destination.findUnique({ where: { id } });
}

/** Best-effort lookup for free-text destination names (e.g. from the public enquiry form). */
export async function findDestinationByNameOrSlug(nameOrSlug: string) {
  return prisma.destination.findFirst({
    where: {
      isDeleted: false,
      OR: [{ slug: nameOrSlug }, { name: { equals: nameOrSlug, mode: "insensitive" } }],
    },
  });
}

export async function createDestination(payload: Prisma.DestinationCreateInput) {
  return prisma.destination.create({ data: payload });
}

export async function updateDestination(id: string, payload: Prisma.DestinationUpdateInput) {
  return prisma.destination.update({ where: { id }, data: payload });
}

export async function removeDestination(id: string) {
  // Soft delete
  return prisma.destination.update({ where: { id }, data: { isDeleted: true } });
}

export async function toggleDestinationStatus(id: string) {
  const current = await prisma.destination.findUnique({ where: { id } });
  if (!current) return null;
  const next = current.status === "Active" ? "Inactive" : "Active";
  return prisma.destination.update({ where: { id }, data: { status: next } });
}
