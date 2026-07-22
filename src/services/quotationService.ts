import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import type { Paginated, ActivityDetail, HotelStayDetail, ItineraryDayDetail, TransferStopDetail } from "@/types/admin";
import type { Prisma } from "@/generated/prisma/client";
import type { QuotationItemInput } from "@/lib/validation/quotation";
import { findItineraryByPackageId } from "@/services/campaignItineraryService";
import { findHotelByPackageId } from "@/services/campaignHotelService";
import { findTransferByPackageId } from "@/services/campaignTransferService";
import { listTransferTypes } from "@/services/transferTypeService";

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
          currencyCode: item.currencyCode ?? "INR",
          foreignAmount: item.foreignAmount ?? null,
          exchangeRate: item.exchangeRate ?? 1,
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
            currencyCode: item.currencyCode ?? "INR",
            foreignAmount: item.foreignAmount ?? null,
            exchangeRate: item.exchangeRate ?? 1,
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
          currencyCode: item.currencyCode,
          foreignAmount: item.foreignAmount,
          exchangeRate: item.exchangeRate,
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

function textToLines(text: string): string[] {
  return text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
}

/**
 * Same public shape as toPublicQuoteData, plus the full campaign itinerary
 * (day-wise plan, hotels, activities, transfers, inclusions/exclusions) when
 * the quotation was built from a Campaign template — mirrors exactly what
 * the public Campaign Detail page (src/app/campaigns/[slug]/page.tsx) loads.
 * Used only by PDF generation; quotations built without a campaign template
 * simply omit `campaignDetail` and fall back to the plain line-item layout.
 */
export async function buildQuotationPdfData(quotation: NonNullable<Awaited<ReturnType<typeof getQuotation>>>) {
  const base = toPublicQuoteData(quotation);
  const campaign = quotation.campaign;

  if (!campaign) return base;

  const [itinerary, hotelPlan, transferPlan, transferTypesRes] = await Promise.all([
    findItineraryByPackageId(campaign.id),
    findHotelByPackageId(campaign.id),
    findTransferByPackageId(campaign.id),
    listTransferTypes({ pageSize: 1000 }),
  ]);

  const transferTypeNameById = new Map(transferTypesRes.items.map((t) => [t.id, t.name]));
  const days = (itinerary?.days as unknown as ItineraryDayDetail[] | undefined) ?? [];
  const hotels = (hotelPlan?.hotels as unknown as HotelStayDetail[] | undefined) ?? [];
  const transfers = (transferPlan?.transfers as unknown as TransferStopDetail[] | undefined) ?? [];
  const activities = (campaign.activities as unknown as ActivityDetail[] | undefined) ?? [];

  return {
    ...base,
    campaignDetail: {
      name: campaign.name,
      nights: campaign.nights,
      days: campaign.days,
      heroImage: campaign.coverBanner || campaign.thumbnail || "",
      itineraryDays: days,
      hotels,
      activities,
      transfers: transfers.map((t) => ({
        ...t,
        typeName: (t.transferTypeId && transferTypeNameById.get(t.transferTypeId)) || "Transfer",
      })),
      inclusionLines: textToLines(campaign.inclusionsText || ""),
      exclusionLines: textToLines(campaign.exclusionsText || ""),
    },
  };
}
