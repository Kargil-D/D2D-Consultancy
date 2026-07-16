import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import type { Paginated } from "@/types/admin";
import type { Prisma } from "@/generated/prisma/client";
import type { QuotationItemInput } from "@/lib/validation/quotation";

const QUOTATION_INCLUDE = {
  lead: true,
  destination: true,
  campaign: true,
  items: { orderBy: { sortOrder: "asc" as const } },
};

export interface ListQuery {
  search?: string;
  page?: number;
  pageSize?: number;
  filter?: Prisma.QuotationWhereInput;
}

export function computeTotals(items: { qty: number; cost: number }[], marginPercent: number) {
  const totalCost = items.reduce((sum, i) => sum + i.qty * i.cost, 0);
  const marginValue = Math.round(totalCost * (marginPercent / 100));
  const sellingPrice = totalCost + marginValue;
  return { totalCost, marginValue, sellingPrice };
}

export async function listQuotations(query: ListQuery = {}) {
  const { search = "", page = 1, pageSize = 10, filter = {} } = query;
  const where: Prisma.QuotationWhereInput = { isDeleted: false, ...filter };

  if (search.trim()) {
    where.lead = {
      OR: [
        { customerName: { contains: search, mode: "insensitive" } },
        { mobile: { contains: search, mode: "insensitive" } },
      ],
    };
  }

  const total = await prisma.quotation.count({ where });
  const items = await prisma.quotation.findMany({
    where,
    include: QUOTATION_INCLUDE,
    orderBy: { createdDate: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return { items, total, page, pageSize } satisfies Paginated<(typeof items)[number]>;
}

export async function getQuotation(id: string) {
  return prisma.quotation.findUnique({ where: { id }, include: QUOTATION_INCLUDE });
}

export async function getQuotationByShareToken(token: string) {
  return prisma.quotation.findFirst({
    where: { shareToken: token, isDeleted: false },
    include: QUOTATION_INCLUDE,
  });
}

interface QuotationInput {
  leadId: string;
  destinationId: string;
  campaignId?: string | null;
  marginPercent: number;
  items: QuotationItemInput[];
}

export async function createQuotation(input: QuotationInput) {
  return prisma.$transaction(async (tx) => {
    const quotation = await tx.quotation.create({
      data: {
        leadId: input.leadId,
        destinationId: input.destinationId,
        campaignId: input.campaignId || null,
        marginPercent: input.marginPercent,
      },
    });
    if (input.items.length > 0) {
      await tx.quotationItem.createMany({
        data: input.items.map((item, i) => ({
          quotationId: quotation.id,
          component: item.component,
          detail: item.detail ?? "",
          qty: item.qty,
          cost: item.cost,
          sortOrder: item.sortOrder ?? i,
        })),
      });
    }
    return tx.quotation.findUniqueOrThrow({ where: { id: quotation.id }, include: QUOTATION_INCLUDE });
  });
}

export async function updateQuotation(id: string, input: Partial<QuotationInput>) {
  return prisma.$transaction(async (tx) => {
    await tx.quotation.update({
      where: { id },
      data: {
        ...(input.destinationId !== undefined && { destinationId: input.destinationId }),
        ...(input.campaignId !== undefined && { campaignId: input.campaignId || null }),
        ...(input.marginPercent !== undefined && { marginPercent: input.marginPercent }),
      },
    });
    if (input.items) {
      await tx.quotationItem.deleteMany({ where: { quotationId: id } });
      if (input.items.length > 0) {
        await tx.quotationItem.createMany({
          data: input.items.map((item, i) => ({
            quotationId: id,
            component: item.component,
            detail: item.detail ?? "",
            qty: item.qty,
            cost: item.cost,
            sortOrder: item.sortOrder ?? i,
          })),
        });
      }
    }
    return tx.quotation.findUniqueOrThrow({ where: { id }, include: QUOTATION_INCLUDE });
  });
}

export async function removeQuotation(id: string) {
  return prisma.quotation.update({ where: { id }, data: { isDeleted: true } });
}

export async function duplicateQuotation(id: string) {
  const source = await prisma.quotation.findUniqueOrThrow({ where: { id }, include: { items: true } });
  return prisma.$transaction(async (tx) => {
    const copy = await tx.quotation.create({
      data: {
        leadId: source.leadId,
        destinationId: source.destinationId,
        campaignId: source.campaignId,
        marginPercent: source.marginPercent,
      },
    });
    if (source.items.length > 0) {
      await tx.quotationItem.createMany({
        data: source.items.map((item) => ({
          quotationId: copy.id,
          component: item.component,
          detail: item.detail,
          qty: item.qty,
          cost: item.cost,
          sortOrder: item.sortOrder,
        })),
      });
    }
    return tx.quotation.findUniqueOrThrow({ where: { id: copy.id }, include: QUOTATION_INCLUDE });
  });
}

export async function generateShareLink(id: string) {
  const token = crypto.randomBytes(24).toString("hex");
  const quotation = await prisma.quotation.update({
    where: { id },
    data: { shareToken: token, status: "Sent" },
  });
  return quotation.shareToken as string;
}

export async function markQuotationSent(id: string) {
  return prisma.quotation.update({ where: { id }, data: { status: "Sent" } });
}

export const quoteCode = (seq: number) => `QT-${seq.toString().padStart(4, "0")}`;

/** Strips internal cost/margin fields — only ever pass this shape to a PDF, email, or public link. */
export function toPublicQuoteData(quotation: NonNullable<Awaited<ReturnType<typeof getQuotation>>>) {
  const { sellingPrice } = computeTotals(quotation.items, quotation.marginPercent);
  return {
    quoteCode: quoteCode(quotation.seq),
    customerName: quotation.lead.customerName,
    destinationName: quotation.destination.name,
    travelDate: quotation.lead.travelDate ? quotation.lead.travelDate.toLocaleDateString("en-IN") : null,
    createdDate: quotation.createdDate.toLocaleDateString("en-IN"),
    components: quotation.items.map((i) => ({ component: i.component, detail: i.detail, qty: i.qty })),
    sellingPrice,
    status: quotation.status,
  };
}
