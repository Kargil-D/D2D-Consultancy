import { prisma } from "@/lib/prisma";
import type { Paginated } from "@/types/admin";
import type { Prisma } from "@/generated/prisma/client";
import type { HotelMasterCreate, HotelMasterUpdate } from "@/lib/validation/hotelMaster";

export interface ListQuery {
  search?: string;
  page?: number;
  pageSize?: number;
  filter?: Prisma.HotelMasterWhereInput;
}

const HOTEL_MASTER_INCLUDE = { destination: true };

export async function listHotelMasters(query: ListQuery = {}) {
  const { search = "", page = 1, pageSize = 10, filter = {} } = query;
  const where: Prisma.HotelMasterWhereInput = { isDeleted: false, ...filter };

  if (search.trim()) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { category: { contains: search, mode: "insensitive" } },
    ];
  }

  const total = await prisma.hotelMaster.count({ where });
  const items = await prisma.hotelMaster.findMany({
    where,
    include: HOTEL_MASTER_INCLUDE,
    orderBy: { name: "asc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return { items, total, page, pageSize } satisfies Paginated<(typeof items)[number]>;
}

/** Full active list, unpaginated — used by the Quotation Hotel step's search/select. */
export function listActiveHotelMasters() {
  return prisma.hotelMaster.findMany({
    where: { isDeleted: false, status: "Active" },
    include: HOTEL_MASTER_INCLUDE,
    orderBy: { name: "asc" },
  });
}

export function getHotelMaster(id: string) {
  return prisma.hotelMaster.findUnique({ where: { id }, include: HOTEL_MASTER_INCLUDE });
}

export function createHotelMaster(input: HotelMasterCreate, createdBy: string) {
  return prisma.hotelMaster.create({
    data: {
      name: input.name,
      destinationId: input.destinationId || null,
      images: input.images ?? [],
      description: input.description ?? "",
      category: input.category || null,
      roomTypes: input.roomTypes ?? [],
      mealPlans: input.mealPlans ?? [],
      amenities: input.amenities ?? [],
      googleMapUrl: input.googleMapUrl || null,
      website: input.website || null,
      status: input.status ?? "Active",
      createdBy,
      updatedBy: createdBy,
    },
    include: HOTEL_MASTER_INCLUDE,
  });
}

export function updateHotelMaster(id: string, input: HotelMasterUpdate, updatedBy: string) {
  return prisma.hotelMaster.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.destinationId !== undefined && { destinationId: input.destinationId || null }),
      ...(input.images !== undefined && { images: input.images }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.category !== undefined && { category: input.category || null }),
      ...(input.roomTypes !== undefined && { roomTypes: input.roomTypes }),
      ...(input.mealPlans !== undefined && { mealPlans: input.mealPlans }),
      ...(input.amenities !== undefined && { amenities: input.amenities }),
      ...(input.googleMapUrl !== undefined && { googleMapUrl: input.googleMapUrl || null }),
      ...(input.website !== undefined && { website: input.website || null }),
      ...(input.status !== undefined && { status: input.status }),
      updatedBy,
    },
    include: HOTEL_MASTER_INCLUDE,
  });
}

export async function removeHotelMaster(id: string) {
  return prisma.hotelMaster.update({ where: { id }, data: { isDeleted: true } });
}

export async function toggleHotelMasterStatus(id: string, updatedBy: string) {
  const current = await prisma.hotelMaster.findUnique({ where: { id } });
  if (!current) return null;
  const next = current.status === "Active" ? "Inactive" : "Active";
  return prisma.hotelMaster.update({ where: { id }, data: { status: next, updatedBy }, include: HOTEL_MASTER_INCLUDE });
}
