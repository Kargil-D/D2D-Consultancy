import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/apiError";
import type { Paginated } from "@/types/admin";
import type { Prisma } from "@/generated/prisma/client";

export interface ListQuery {
  search?: string;
  page?: number;
  pageSize?: number;
  filter?: Prisma.ActivityWhereInput;
}

const ACTIVITY_INCLUDE = {
  destination: true,
  cities: { include: { city: true }, orderBy: { city: { name: "asc" } } },
} satisfies Prisma.ActivityInclude;

type ActivityWithRelations = Prisma.ActivityGetPayload<{ include: typeof ACTIVITY_INCLUDE }>;

/** Flattens the ActivityCity join rows into a plain `cities: City[]` list for API consumers. */
function mapActivity(rec: ActivityWithRelations) {
  const { cities, ...rest } = rec;
  return { ...rest, cities: cities.map((ac) => ac.city) };
}

/** A city can only be attached to an Activity if it's already mapped to that Activity's
 * Destination (via DestinationCity) — enforced here since Prisma can't express a cross-table
 * subset constraint at the schema level. */
async function assertCitiesBelongToDestination(destinationId: string, cityIds: string[]) {
  if (cityIds.length === 0) return;
  const mapped = await prisma.destinationCity.findMany({
    where: { destinationId, cityId: { in: cityIds } },
    select: { cityId: true },
  });
  const mappedIds = new Set(mapped.map((m) => m.cityId));
  const invalid = cityIds.filter((id) => !mappedIds.has(id));
  if (invalid.length > 0) {
    throw new ApiError(400, "Selected cities must belong to the selected destination");
  }
}

export async function listActivities(query: ListQuery = {}): Promise<Paginated<ReturnType<typeof mapActivity>>> {
  const { search = "", page = 1, pageSize = 10, filter = {} } = query;

  const where: Prisma.ActivityWhereInput = { isDeleted: false, ...filter };

  if (search.trim()) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { destination: { name: { contains: search, mode: "insensitive" } } },
      { cities: { some: { city: { name: { contains: search, mode: "insensitive" } } } } },
    ];
  }

  const total = await prisma.activity.count({ where });
  const items = await prisma.activity.findMany({
    where,
    orderBy: { displayOrder: "asc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: ACTIVITY_INCLUDE,
  });

  return { items: items.map(mapActivity), total, page, pageSize };
}

export async function getActivity(id: string) {
  const rec = await prisma.activity.findUnique({ where: { id }, include: ACTIVITY_INCLUDE });
  return rec ? mapActivity(rec) : null;
}

export async function createActivity(payload: Prisma.ActivityUncheckedCreateInput, cityIds: string[]) {
  const uniqueCityIds = Array.from(new Set(cityIds));
  await assertCitiesBelongToDestination(payload.destinationId, uniqueCityIds);

  const rec = await prisma.activity.create({
    data: {
      ...payload,
      cities: uniqueCityIds.length ? { create: uniqueCityIds.map((cityId) => ({ cityId })) } : undefined,
    },
    include: ACTIVITY_INCLUDE,
  });
  return mapActivity(rec);
}

/** `cityIds` left `undefined` leaves existing city links untouched; passing an array (including `[]`) replaces the full set. */
export async function updateActivity(id: string, payload: Prisma.ActivityUncheckedUpdateInput, cityIds?: string[]) {
  const uniqueCityIds = cityIds ? Array.from(new Set(cityIds)) : undefined;

  if (uniqueCityIds) {
    const destinationId =
      typeof payload.destinationId === "string"
        ? payload.destinationId
        : (await prisma.activity.findUniqueOrThrow({ where: { id }, select: { destinationId: true } })).destinationId;
    await assertCitiesBelongToDestination(destinationId, uniqueCityIds);
  }

  const rec = await prisma.activity.update({
    where: { id },
    data: {
      ...payload,
      ...(uniqueCityIds ? { cities: { deleteMany: {}, create: uniqueCityIds.map((cityId) => ({ cityId })) } } : {}),
    },
    include: ACTIVITY_INCLUDE,
  });
  return mapActivity(rec);
}

export async function removeActivity(id: string) {
  // Soft delete — the ActivityCity join rows are left in place (cascade only fires on a hard delete).
  return prisma.activity.update({ where: { id }, data: { isDeleted: true } });
}

export async function toggleActivityStatus(id: string) {
  const current = await prisma.activity.findUnique({ where: { id } });
  if (!current) return null;
  const next = current.status === "Active" ? "Inactive" : "Active";
  return prisma.activity.update({ where: { id }, data: { status: next } });
}
