import { prisma } from "@/lib/prisma";
import type { Paginated } from "@/types/admin";
import type { Prisma, Campaign as CampaignModel } from "@/generated/prisma/client";

export interface ListQuery {
  search?: string;
  page?: number;
  pageSize?: number;
  filter?: Prisma.CampaignWhereInput;
}

export async function listCampaigns(query: ListQuery = {}): Promise<Paginated<CampaignModel>> {
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
    orderBy: { createdDate: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return { items, total, page, pageSize };
}

export async function getCampaign(id: string) {
  return prisma.campaign.findUnique({ where: { id } });
}

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
