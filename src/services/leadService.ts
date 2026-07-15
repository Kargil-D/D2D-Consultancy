import { prisma } from "@/lib/prisma";
import type { Paginated } from "@/types/admin";
import type { Prisma, LeadStatus } from "@/generated/prisma/client";

export interface ListQuery {
  search?: string;
  page?: number;
  pageSize?: number;
  filter?: Prisma.LeadWhereInput;
}

export async function listLeads(query: ListQuery = {}): Promise<Paginated<Prisma.LeadGetPayload<{
  include: { destination: true; assignedTo: true };
}>>> {
  const { search = "", page = 1, pageSize = 10, filter = {} } = query;

  const where: Prisma.LeadWhereInput = { isDeleted: false, ...filter };

  if (search.trim()) {
    where.OR = [
      { customerName: { contains: search, mode: "insensitive" } },
      { mobile: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const total = await prisma.lead.count({ where });
  const items = await prisma.lead.findMany({
    where,
    include: { destination: true, assignedTo: true },
    orderBy: { createdDate: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return { items, total, page, pageSize };
}

export async function getLead(id: string) {
  return prisma.lead.findUnique({
    where: { id },
    include: {
      destination: true,
      assignedTo: true,
      activities: { orderBy: { createdDate: "desc" } },
    },
  });
}

export async function createLead(payload: Prisma.LeadUncheckedCreateInput) {
  return prisma.lead.create({ data: payload });
}

export async function updateLead(id: string, payload: Prisma.LeadUncheckedUpdateInput) {
  return prisma.lead.update({ where: { id }, data: payload });
}

export async function removeLead(id: string) {
  return prisma.lead.update({ where: { id }, data: { isDeleted: true } });
}

export async function updateLeadStatus(id: string, status: LeadStatus) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.lead.findUniqueOrThrow({ where: { id } });
    const updated = await tx.lead.update({ where: { id }, data: { status } });
    await tx.leadActivity.create({
      data: {
        leadId: id,
        message: `Status changed from ${current.status} to ${status}`,
      },
    });
    return updated;
  });
}
