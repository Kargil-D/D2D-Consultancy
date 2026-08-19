import { prisma } from "@/lib/prisma";
import type { Paginated } from "@/types/admin";
import type { Prisma } from "@/generated/prisma/client";

export interface ListQuery {
  search?: string;
  page?: number;
  pageSize?: number;
  /** Restricts results to cities tagged with this country, plus untagged (legacy) cities —
   * scopes the Destination form's city search to the destination's own country instead of the
   * whole cross-country master. */
  country?: string;
}

export async function listCities(query: ListQuery = {}): Promise<Paginated<{ id: string; name: string; state: string | null; country: string | null }>> {
  const { search = "", page = 1, pageSize = 20, country } = query;

  const where: Prisma.CityWhereInput = { isDeleted: false };
  if (search.trim()) {
    where.name = { contains: search.trim(), mode: "insensitive" };
  }
  if (country?.trim()) {
    where.OR = [{ country: null }, { country: { equals: country.trim(), mode: "insensitive" } }];
  }

  const total = await prisma.city.count({ where });
  const items = await prisma.city.findMany({
    where,
    orderBy: { name: "asc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return { items, total, page, pageSize };
}

/** Case-insensitive find-or-create, so typing "kuala lumpur" when "Kuala Lumpur" already exists in the City master reuses the same row instead of creating a duplicate. New rows are tagged with `country` (when given) so future destination-scoped searches can find them. */
export async function findOrCreateCity(name: string, country?: string) {
  const trimmed = name.trim();
  const existing = await prisma.city.findFirst({
    where: { isDeleted: false, name: { equals: trimmed, mode: "insensitive" } },
  });
  if (existing) return existing;
  return prisma.city.create({ data: { name: trimmed, country: country?.trim() || undefined } });
}
