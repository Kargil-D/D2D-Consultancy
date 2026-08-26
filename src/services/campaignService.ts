import { cache } from "react";
import { prisma } from "@/lib/prisma";
import type { Paginated } from "@/types/admin";
import type { Prisma } from "@/generated/prisma/client";

export type CampaignWithDestination = Prisma.CampaignGetPayload<{
  include: { destination: true };
}>;

export interface ListQuery {
  search?: string;
  page?: number;
  pageSize?: number;
  filter?: Prisma.CampaignWhereInput;
}

export async function listCampaigns(query: ListQuery = {}): Promise<Paginated<CampaignWithDestination>> {
  const { search = "", page = 1, pageSize = 10, filter = {} } = query;

  const where: Prisma.CampaignWhereInput = { isDeleted: false, ...filter };

  if (search.trim()) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { packageType: { contains: search, mode: "insensitive" } },
      { shortDescription: { contains: search, mode: "insensitive" } },
    ];
  }

  const total = await prisma.campaign.count({ where });
  const items = await prisma.campaign.findMany({
    where,
    include: { destination: true },
    orderBy: { createdDate: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return { items, total, page, pageSize };
}

/** Small scalar fields only — everything the public menu and package cards render. Deliberately
 * excludes the heavy columns (activities Json, gallery, inclusions/exclusions text) so public
 * traffic doesn't pull the whole row out of the database on every view. */
const CAMPAIGN_SUMMARY_SELECT = {
  id: true,
  name: true,
  slug: true,
  shortDescription: true,
  thumbnail: true,
  coverBanner: true,
  viewDetailsRedirect: true,
  days: true,
  nights: true,
  startingPrice: true,
  offerPrice: true,
  isFeatured: true,
} satisfies Prisma.CampaignSelect;

export type CampaignSummary = Prisma.CampaignGetPayload<{ select: typeof CAMPAIGN_SUMMARY_SELECT }>;

export async function listCampaignSummaries(query: ListQuery = {}): Promise<CampaignSummary[]> {
  const { pageSize = 100, filter = {} } = query;
  return prisma.campaign.findMany({
    where: { isDeleted: false, ...filter },
    select: CAMPAIGN_SUMMARY_SELECT,
    orderBy: { createdDate: "desc" },
    take: pageSize,
  });
}

export async function getCampaign(id: string) {
  return prisma.campaign.findUnique({ where: { id } });
}

/** React-cached: generateMetadata and the page body both call this per request — cache() makes
 * that one database query instead of two. */
export const getCampaignBySlug = cache(async (slug: string) => {
  return prisma.campaign.findUnique({ where: { slug }, include: { destination: true } });
});

export async function createCampaign(payload: Prisma.CampaignUncheckedCreateInput) {
  return prisma.campaign.create({ data: payload });
}

export async function updateCampaign(id: string, payload: Prisma.CampaignUncheckedUpdateInput) {
  return prisma.campaign.update({ where: { id }, data: payload });
}

export async function removeCampaign(id: string) {
  // Soft delete
  return prisma.campaign.update({ where: { id }, data: { isDeleted: true } });
}

export async function toggleCampaignStatus(id: string) {
  const current = await prisma.campaign.findUnique({ where: { id } });
  if (!current) return null;
  const next = current.status === "Active" ? "Inactive" : "Active";
  return prisma.campaign.update({ where: { id }, data: { status: next } });
}
