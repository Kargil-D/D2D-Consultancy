import { prisma } from "@/lib/prisma";
import type { Paginated } from "@/types/admin";
import type { Prisma } from "@/generated/prisma/client";

export interface ListQuery {
  search?: string;
  page?: number;
  pageSize?: number;
  filter?: Prisma.DestinationWhereInput;
}

const CITIES_INCLUDE = {
  cities: { include: { city: true }, orderBy: { city: { name: "asc" } } },
} satisfies Prisma.DestinationInclude;

type DestinationWithCities = Prisma.DestinationGetPayload<{ include: typeof CITIES_INCLUDE }>;

/** Flattens the DestinationCity join rows into a plain `cities: City[]` list for API consumers. */
function mapDestination(rec: DestinationWithCities) {
  const { cities, ...rest } = rec;
  return { ...rest, cities: cities.map((dc) => dc.city) };
}

export async function listDestinations(query: ListQuery = {}): Promise<Paginated<ReturnType<typeof mapDestination>>> {
  const { search = "", page = 1, pageSize = 10, filter = {} } = query;

  const where: Prisma.DestinationWhereInput = { isDeleted: false, ...filter };

  if (search.trim()) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { country: { contains: search, mode: "insensitive" } },
      { state: { contains: search, mode: "insensitive" } },
      { city: { contains: search, mode: "insensitive" } },
      { cities: { some: { city: { name: { contains: search, mode: "insensitive" } } } } },
    ];
  }

  const total = await prisma.destination.count({ where });
  const items = await prisma.destination.findMany({
    where,
    orderBy: { displayOrder: "asc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: CITIES_INCLUDE,
  });

  return { items: items.map(mapDestination), total, page, pageSize };
}

export async function getDestination(id: string) {
  const rec = await prisma.destination.findUnique({ where: { id }, include: CITIES_INCLUDE });
  return rec ? mapDestination(rec) : null;
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

export async function createDestination(payload: Prisma.DestinationCreateInput, cityIds: string[] = []) {
  const rec = await prisma.destination.create({
    data: {
      ...payload,
      cities: cityIds.length ? { create: cityIds.map((cityId) => ({ cityId })) } : undefined,
    },
    include: CITIES_INCLUDE,
  });
  return mapDestination(rec);
}

/** `cityIds` left `undefined` leaves existing city links untouched; passing an array (including `[]`) replaces the full set. */
export async function updateDestination(id: string, payload: Prisma.DestinationUpdateInput, cityIds?: string[]) {
  const rec = await prisma.destination.update({
    where: { id },
    data: {
      ...payload,
      ...(cityIds ? { cities: { deleteMany: {}, create: cityIds.map((cityId) => ({ cityId })) } } : {}),
    },
    include: CITIES_INCLUDE,
  });
  return mapDestination(rec);
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
