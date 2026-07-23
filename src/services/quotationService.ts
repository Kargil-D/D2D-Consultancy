import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import type {
  Paginated,
  ActivityDetail,
  HotelStayDetail,
  ItineraryDayDetail,
  TransferStopDetail,
  QuotationItineraryDay,
  QuotationHotelOptionGroup,
  QuotationTransferItem,
  QuotationActivityItem,
} from "@/types/admin";
import type { Prisma } from "@/generated/prisma/client";
import type { QuotationCreate, QuotationUpdate } from "@/lib/validation/quotation";
import { createLead, updateLead, updateLeadStatus } from "@/services/leadService";
import { findItineraryByPackageId } from "@/services/campaignItineraryService";
import { findHotelByPackageId } from "@/services/campaignHotelService";
import { findTransferByPackageId } from "@/services/campaignTransferService";
import { listTransferTypes } from "@/services/transferTypeService";

const QUOTATION_INCLUDE = {
  lead: true,
  destination: true,
  campaign: true,
  salesExecutive: true,
  items: { orderBy: { sortOrder: "asc" as const } },
};

export interface ListQuery {
  search?: string;
  page?: number;
  pageSize?: number;
  filter?: Prisma.QuotationWhereInput;
}

export function computeTotals(items: { qty: number; cost: number }[], marginPercent: number, gstPercent: number) {
  const totalCost = items.reduce((sum, i) => sum + i.qty * i.cost, 0);
  const marginValue = Math.round(totalCost * (marginPercent / 100));
  const subtotal = totalCost + marginValue;
  const gstValue = Math.round(subtotal * (gstPercent / 100));
  const sellingPrice = subtotal + gstValue;
  return { totalCost, marginValue, gstValue, sellingPrice };
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

const LEAD_PIPELINE_ORDER = ["New", "Contacted", "FollowUp"] as const;

/**
 * Step 1 has no "pick a lead" dropdown — it's a plain customer-detail form. This finds an
 * existing Lead by exact mobile match (and refreshes its display fields) or creates a new
 * one, so the Leads pipeline/reporting keeps working untouched. Status only ever moves
 * forward to "QuotationSent" (never downgrades a Lead already further along, e.g. "Won").
 */
export async function findOrCreateLeadForQuotation(
  customer: { customerName: string; mobile: string; email?: string | null; companyName?: string | null },
  destinationId: string,
  source?: string | null,
) {
  const existing = await prisma.lead.findFirst({ where: { mobile: customer.mobile, isDeleted: false } });

  if (existing) {
    const changed =
      existing.customerName !== customer.customerName ||
      (existing.email ?? null) !== (customer.email ?? null) ||
      (existing.companyName ?? null) !== (customer.companyName ?? null);
    const lead = changed
      ? await updateLead(existing.id, {
          customerName: customer.customerName,
          email: customer.email || null,
          companyName: customer.companyName || null,
        })
      : existing;

    if ((LEAD_PIPELINE_ORDER as readonly string[]).includes(lead.status)) {
      await updateLeadStatus(lead.id, "QuotationSent");
      return prisma.lead.findUniqueOrThrow({ where: { id: lead.id } });
    }
    return lead;
  }

  return createLead({
    customerName: customer.customerName,
    mobile: customer.mobile,
    email: customer.email || null,
    companyName: customer.companyName || null,
    destinationId,
    source: (source as Prisma.LeadUncheckedCreateInput["source"]) ?? "Manual",
    status: "QuotationSent",
  });
}

function quotationScalarData(input: Partial<QuotationCreate | QuotationUpdate>) {
  return {
    ...(input.destinationId !== undefined && { destinationId: input.destinationId }),
    ...(input.campaignId !== undefined && { campaignId: input.campaignId || null }),
    ...(input.marginPercent !== undefined && { marginPercent: input.marginPercent }),
    ...(input.gstPercent !== undefined && { gstPercent: input.gstPercent }),
    ...(input.travelDate !== undefined && { travelDate: input.travelDate }),
    ...(input.days !== undefined && { days: input.days }),
    ...(input.nights !== undefined && { nights: input.nights }),
    ...(input.adults !== undefined && { adults: input.adults }),
    ...(input.children !== undefined && { children: input.children }),
    ...(input.infants !== undefined && { infants: input.infants }),
    ...(input.salesExecutiveId !== undefined && { salesExecutiveId: input.salesExecutiveId || null }),
    ...(input.source !== undefined && { source: input.source }),
    ...(input.validUntil !== undefined && { validUntil: input.validUntil }),
    ...(input.internalNotes !== undefined && { internalNotes: input.internalNotes }),
    ...(input.itineraryMode !== undefined && { itineraryMode: input.itineraryMode }),
    ...(input.itineraryDays !== undefined && { itineraryDays: input.itineraryDays as Prisma.InputJsonValue }),
    ...(input.hotelOptions !== undefined && { hotelOptions: input.hotelOptions as Prisma.InputJsonValue }),
    ...(input.transfers !== undefined && { transfers: input.transfers as Prisma.InputJsonValue }),
    ...(input.activities !== undefined && { activities: input.activities as Prisma.InputJsonValue }),
  } satisfies Prisma.QuotationUncheckedUpdateInput;
}

export async function createQuotation(input: QuotationCreate) {
  const lead = await findOrCreateLeadForQuotation(input.customer, input.destinationId, input.source);

  return prisma.$transaction(async (tx) => {
    const quotation = await tx.quotation.create({
      data: {
        leadId: lead.id,
        ...quotationScalarData(input),
      } as Prisma.QuotationUncheckedCreateInput,
    });
    if (input.items.length > 0) {
      await tx.quotationItem.createMany({
        data: input.items.map((item, i) => ({
          quotationId: quotation.id,
          sourceId: item.sourceId ?? null,
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

export async function updateQuotation(id: string, input: QuotationUpdate) {
  if (input.customer) {
    const current = await prisma.quotation.findUniqueOrThrow({ where: { id } });
    const lead = await findOrCreateLeadForQuotation(
      input.customer,
      input.destinationId ?? current.destinationId,
      input.source,
    );
    if (lead.id !== current.leadId) {
      await prisma.quotation.update({ where: { id }, data: { leadId: lead.id } });
    }
  }

  return prisma.$transaction(async (tx) => {
    await tx.quotation.update({ where: { id }, data: quotationScalarData(input) });
    if (input.items) {
      await tx.quotationItem.deleteMany({ where: { quotationId: id } });
      if (input.items.length > 0) {
        await tx.quotationItem.createMany({
          data: input.items.map((item, i) => ({
            quotationId: id,
            sourceId: item.sourceId ?? null,
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
        gstPercent: source.gstPercent,
        travelDate: source.travelDate,
        days: source.days,
        nights: source.nights,
        adults: source.adults,
        children: source.children,
        infants: source.infants,
        salesExecutiveId: source.salesExecutiveId,
        source: source.source,
        validUntil: source.validUntil,
        internalNotes: source.internalNotes,
        itineraryMode: source.itineraryMode,
        itineraryDays: source.itineraryDays as Prisma.InputJsonValue,
        hotelOptions: source.hotelOptions as Prisma.InputJsonValue,
        transfers: source.transfers as Prisma.InputJsonValue,
        activities: source.activities as Prisma.InputJsonValue,
      },
    });
    if (source.items.length > 0) {
      await tx.quotationItem.createMany({
        data: source.items.map((item) => ({
          quotationId: copy.id,
          sourceId: item.sourceId,
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

function textToLines(text: string): string[] {
  return text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
}

/** Maps a legacy Campaign-template day into the wizard's own day shape, for quotations that never used Step 2. */
function dayFromCampaign(d: ItineraryDayDetail): QuotationItineraryDay {
  const notes = [d.stayDetails, d.transportDetails].filter(Boolean).join(" — ");
  return {
    id: d.id,
    dayNumber: d.dayNumber,
    title: d.title,
    description: d.description,
    images: d.dayImage ? [d.dayImage] : [],
    meals: d.mealsIncluded,
    notes,
  };
}

/** Maps legacy Campaign hotels into a single "Option A" group, for quotations that never used Step 3. */
function hotelOptionsFromCampaign(hotels: HotelStayDetail[]): QuotationHotelOptionGroup[] {
  if (hotels.length === 0) return [];
  return [
    {
      id: "campaign-hotels",
      label: "Option A",
      hotels: hotels.map((h) => ({
        id: h.id,
        hotelMasterId: null,
        hotelName: h.name,
        images: h.images ?? [],
        description: h.description,
        category: null,
        roomType: h.roomType,
        mealPlan: "",
        amenities: [],
        googleMapUrl: null,
        website: null,
        checkIn: "",
        checkOut: "",
        rooms: 1,
        nights: 0,
      })),
    },
  ];
}

/** Maps legacy Campaign transfers into the wizard's own transfer shape, for quotations that never used Step 4. */
function transfersFromCampaign(transfers: (TransferStopDetail & { typeName: string })[]): QuotationTransferItem[] {
  return transfers.map((t) => ({
    id: t.id,
    name: t.typeName,
    description: "",
    images: [],
    pickupLocation: t.from,
    dropLocation: t.to,
    vehicleType: t.typeName,
    mode: "Private",
    duration: "",
    pickupTime: "",
    dropTime: "",
    status: "Included",
    notes: "",
  }));
}

/** Maps legacy Campaign activities into the wizard's own activity shape, for quotations that never used Step 5. */
function activitiesFromCampaign(activities: ActivityDetail[]): QuotationActivityItem[] {
  return activities.map((a) => ({
    id: a.id,
    name: a.title,
    description: "",
    images: [],
    duration: "",
    reportingTime: "",
    activityTime: "",
    pax: 0,
    notes: "",
  }));
}

/**
 * The single source of truth for anything shown to the customer (PDF, email, public share
 * link) — strips every internal cost/margin field, only the final selling price survives.
 *
 * Itinerary/Hotels/Transfers/Activities come from the quotation's own Step 2–5 content
 * first; a quotation built from a Campaign template before those steps existed (or one
 * where a step was simply left empty) falls back to that campaign's own itinerary/hotel/
 * transfer/activity data instead, mapped into the same shape so the renderer never has to
 * care which source it came from.
 */
export async function buildPublicQuoteData(quotation: NonNullable<Awaited<ReturnType<typeof getQuotation>>>) {
  const { sellingPrice } = computeTotals(quotation.items, quotation.marginPercent, quotation.gstPercent);

  let itineraryDays = quotation.itineraryDays as unknown as QuotationItineraryDay[];
  let hotelOptions = quotation.hotelOptions as unknown as QuotationHotelOptionGroup[];
  let transfers = quotation.transfers as unknown as QuotationTransferItem[];
  let activities = quotation.activities as unknown as QuotationActivityItem[];
  let heroImage = "";
  let inclusionLines: string[] = [];
  let exclusionLines: string[] = [];

  const campaign = quotation.campaign;
  const needsFallback = itineraryDays.length === 0 || hotelOptions.length === 0 || transfers.length === 0 || activities.length === 0;

  if (campaign && needsFallback) {
    const [itinerary, hotelPlan, transferPlan, transferTypesRes] = await Promise.all([
      findItineraryByPackageId(campaign.id),
      findHotelByPackageId(campaign.id),
      findTransferByPackageId(campaign.id),
      listTransferTypes({ pageSize: 1000 }),
    ]);
    const transferTypeNameById = new Map(transferTypesRes.items.map((t) => [t.id, t.name]));
    const campaignDays = (itinerary?.days as unknown as ItineraryDayDetail[] | undefined) ?? [];
    const campaignHotels = (hotelPlan?.hotels as unknown as HotelStayDetail[] | undefined) ?? [];
    const campaignTransfers = (transferPlan?.transfers as unknown as TransferStopDetail[] | undefined) ?? [];
    const campaignActivities = (campaign.activities as unknown as ActivityDetail[] | undefined) ?? [];

    if (itineraryDays.length === 0) itineraryDays = campaignDays.map(dayFromCampaign);
    if (hotelOptions.length === 0) hotelOptions = hotelOptionsFromCampaign(campaignHotels);
    if (transfers.length === 0) {
      transfers = transfersFromCampaign(
        campaignTransfers.map((t) => ({ ...t, typeName: (t.transferTypeId && transferTypeNameById.get(t.transferTypeId)) || "Transfer" })),
      );
    }
    if (activities.length === 0) activities = activitiesFromCampaign(campaignActivities);

    heroImage = campaign.coverBanner || campaign.thumbnail || "";
    inclusionLines = textToLines(campaign.inclusionsText || "");
    exclusionLines = textToLines(campaign.exclusionsText || "");
  }

  return {
    quoteCode: quoteCode(quotation.seq),
    customerName: quotation.lead.customerName,
    destinationName: quotation.destination.name,
    packageName: campaign?.name ?? null,
    heroImage,
    travelDate: quotation.travelDate
      ? quotation.travelDate.toLocaleDateString("en-IN")
      : quotation.lead.travelDate
        ? quotation.lead.travelDate.toLocaleDateString("en-IN")
        : null,
    days: quotation.days ?? campaign?.days ?? null,
    nights: quotation.nights ?? campaign?.nights ?? null,
    adults: quotation.adults,
    children: quotation.children,
    infants: quotation.infants,
    validUntil: quotation.validUntil ? quotation.validUntil.toLocaleDateString("en-IN") : null,
    createdDate: quotation.createdDate.toLocaleDateString("en-IN"),
    itineraryDays,
    hotelOptions,
    transfers,
    activities,
    inclusionLines,
    exclusionLines,
    sellingPrice,
    status: quotation.status,
  };
}

export type PublicQuoteData = Awaited<ReturnType<typeof buildPublicQuoteData>>;
