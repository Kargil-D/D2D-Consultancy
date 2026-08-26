"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import UserSearchSelect from "@/components/admin/ui/UserSearchSelect";
import {
  Plus,
  Trash2,
  FileDown,
  Download,
  Share2,
  Copy,
  Save,
  Check,
  CheckCircle2,
  FileText,
  ArrowLeft,
  ArrowRight,
  User as UserIcon,
  Map as MapIcon,
  BedDouble,
  ArrowRightLeft,
  Ticket,
  Wallet,
  ListChecks,
  Briefcase,
  X,
} from "lucide-react";
import { Field, inputCls, selectCls, textareaCls } from "@/components/admin/ui/Field";
import DateInput from "@/components/admin/ui/DateInput";
import { useToast } from "@/components/admin/ui/Toast";
import LoadingOverlay from "@/components/admin/ui/LoadingOverlay";
import ImageUpload from "@/components/admin/ui/ImageUpload";
import {
  bookingsApi, currenciesApi, destinationsApi, hotelMasterApi, hotelsApi, itinerariesApi, leadsApi,
  packagesApi, quotationsApi, salesUsersApi, transferTypesApi, transfersApi,
} from "@/lib/adminApi";
import { useAuth } from "@/contexts/AuthContext";
import QuotationItineraryDaysEditor, { newQuotationDay } from "@/components/admin/quotation/QuotationItineraryDaysEditor";
import QuotationHotelOptionsEditor from "@/components/admin/quotation/QuotationHotelOptionsEditor";
import QuotationTransfersEditor from "@/components/admin/quotation/QuotationTransfersEditor";
import QuotationActivitiesEditor from "@/components/admin/quotation/QuotationActivitiesEditor";
import { isFutureDate, todayIso, tomorrowIso } from "@/utils/dateRange";
import type {
  AdminCurrency,
  AdminDestination,
  AdminPackage,
  AdminQuotationItem,
  AdminSalesUser,
  LeadSource,
  PaymentMode,
  QuotationActivityItem,
  QuotationComponentType,
  QuotationCustomerInput,
  QuotationHotelOptionGroup,
  QuotationHotelSelection,
  QuotationItineraryDay,
  QuotationTransferItem,
} from "@/types/admin";

interface QuotationBuilderProps {
  id?: string;
}

/** Hotel/Transfer/Activity costing rows are auto-generated from Steps 3–5 (see reconcileItems) — manual "Other" rows only cover components those steps don't. */
const MANUAL_COMPONENTS: QuotationComponentType[] = ["Visa", "Insurance", "Flight"];
const SOURCES: LeadSource[] = ["Website", "MetaAds", "GoogleAds", "SEO", "WhatsApp", "Referral", "Manual"];

const STEPS = [
  { key: "customer", label: "Customer Details", icon: UserIcon },
  { key: "itinerary", label: "Itinerary", icon: MapIcon },
  { key: "hotels", label: "Hotels", icon: BedDouble },
  { key: "transfers", label: "Transfers", icon: ArrowRightLeft },
  { key: "activities", label: "Activities", icon: Ticket },
  { key: "inclusions", label: "Inclusions/Exclusions", icon: ListChecks },
  { key: "pricing", label: "Pricing", icon: Wallet },
] as const;

const emptyItemRow = (sortOrder: number): AdminQuotationItem => ({
  component: "Visa",
  detail: "",
  qty: 1,
  cost: 0,
  currencyCode: "INR",
  foreignAmount: null,
  exchangeRate: 1,
  sortOrder,
});

const formatINR = (v: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", currencyDisplay: "code", maximumFractionDigits: 0 }).format(v);

/**
 * Keeps Pricing's Hotel/Activity/Transfer rows in lockstep with Steps 3–5 so nothing gets
 * missed: one row per hotel/activity/transfer (matched by sourceId), preserving whatever
 * currency/cost the user already entered, dropping rows whose source was deleted, and
 * leaving manual rows (Visa/Insurance/Flight — no sourceId) untouched.
 */
function reconcileItems(
  items: AdminQuotationItem[],
  hotelOptions: QuotationHotelOptionGroup[],
  transfers: QuotationTransferItem[],
  activities: QuotationActivityItem[],
  currencies: AdminCurrency[],
): AdminQuotationItem[] {
  const bySource = new Map<string, AdminQuotationItem>();
  items.forEach((it) => {
    if (it.sourceId) bySource.set(it.sourceId, it);
  });
  const manual = items.filter((it) => !it.sourceId);
  const defaultRate = currencies.find((c) => c.code === "USD")?.exchangeRate ?? 1;

  const sourced = (sourceId: string, component: QuotationComponentType, detail: string, qty: number): AdminQuotationItem => {
    const existing = bySource.get(sourceId);
    return {
      sourceId,
      component,
      detail,
      qty,
      cost: existing?.cost ?? 0,
      currencyCode: existing?.currencyCode ?? "USD",
      foreignAmount: existing?.foreignAmount ?? null,
      exchangeRate: existing?.exchangeRate ?? defaultRate,
    };
  };

  const hotelRows = hotelOptions.flatMap((g) => g.hotels).map((h) => sourced(h.id, "Hotel", h.hotelName || "Hotel", h.nights || 0));
  const activityRows = activities.map((a) => sourced(a.id, "Activity", a.name || "Activity", a.pax || 0));
  const transferRows = transfers.map((t) => sourced(t.id, "Transfer", t.name || "Transfer", 1));

  return [...manual, ...hotelRows, ...activityRows, ...transferRows].map((it, i) => ({ ...it, sortOrder: i }));
}

interface Draft {
  customer: QuotationCustomerInput;
  destinationId: string;
  campaignId: string;
  travelDate: string;
  travelEndDate: string;
  days: string;
  nights: string;
  adults: number;
  children: number;
  infants: number;
  salesExecutiveId: string;
  source: LeadSource | "";
  validUntil: string;
  internalNotes: string;
  itineraryMode: "template" | "custom";
  itineraryDays: QuotationItineraryDay[];
  hotelOptions: QuotationHotelOptionGroup[];
  transfers: QuotationTransferItem[];
  activities: QuotationActivityItem[];
  inclusionsText: string;
  exclusionsText: string;
  includeChildCosting: boolean;
  marginPercent: number;
  gstPercent: number;
  advanceAmount: number;
  items: AdminQuotationItem[];
}

const emptyDraft = (): Draft => ({
  customer: { customerName: "", mobile: "", email: "", companyName: "" },
  destinationId: "",
  campaignId: "",
  travelDate: "",
  travelEndDate: "",
  days: "",
  nights: "",
  adults: 1,
  children: 0,
  infants: 0,
  salesExecutiveId: "",
  source: "Manual",
  validUntil: "",
  internalNotes: "",
  itineraryMode: "custom",
  itineraryDays: [],
  hotelOptions: [],
  transfers: [],
  activities: [],
  inclusionsText: "",
  exclusionsText: "",
  includeChildCosting: false,
  marginPercent: 0,
  gstPercent: 5,
  advanceAmount: 0,
  items: [],
});

export default function QuotationBuilder({ id: initialId }: QuotationBuilderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { notify } = useToast();
  const { user } = useAuth();

  const [id, setId] = useState<string | undefined>(initialId);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [status, setStatus] = useState<string>("Draft");
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [pdfGeneratedAt, setPdfGeneratedAt] = useState<Date | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [existingBookingId, setExistingBookingId] = useState<string | null>(null);

  interface ConvertPaymentForm {
    paymentDate: string;
    paymentMode: PaymentMode;
    amount: number;
    transactionReference: string;
    referenceImageUrl: string;
    remarks: string;
  }
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [convertPayment, setConvertPayment] = useState<ConvertPaymentForm>({
    paymentDate: "",
    paymentMode: "Cash",
    amount: 0,
    transactionReference: "",
    referenceImageUrl: "",
    remarks: "",
  });
  /** Blocks opening the payment dialog (no Advance Amount set yet) — its own small centered popup. */
  const [convertGateError, setConvertGateError] = useState<string | null>(null);
  /** Validation failures inside the payment dialog itself — shown as an inline banner in that same popup. */
  const [convertFormError, setConvertFormError] = useState<string | null>(null);

  const [destinations, setDestinations] = useState<AdminDestination[]>([]);
  const [campaigns, setCampaigns] = useState<AdminPackage[]>([]);
  const [currencies, setCurrencies] = useState<AdminCurrency[]>([]);
  const [salesUsers, setSalesUsers] = useState<AdminSalesUser[]>([]);

  const [loading, setLoading] = useState(!!initialId);
  const [saving, setSaving] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  type AutoSaveStatus = "idle" | "saving" | "saved" | "error";
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>("idle");
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextAutoSaveRef = useRef(true);

  const patch = (next: Partial<Draft>) => setDraft((d) => ({ ...d, ...next }));

  useEffect(() => {
    (async () => {
      const [destRes, currRes, salesRes] = await Promise.all([
        destinationsApi.all(),
        currenciesApi.list({ pageSize: 100, filter: { status: "Active" } }),
        salesUsersApi.list(),
      ]);
      if (destRes.success) setDestinations(destRes.data);
      if (currRes.success) setCurrencies(currRes.data.items);
      if (salesRes.success) setSalesUsers(salesRes.data);
    })();
  }, []);

  // Default Sales Executive to the logged-in user on a fresh quotation ("Auto from Login") — still overridable.
  useEffect(() => {
    if (!initialId && user?.id) patch({ salesExecutiveId: user.id });
  }, [initialId, user?.id]);

  // Keep Pricing's Hotel/Activity/Transfer rows in sync the moment Steps 3–5 change — not just when Pricing is opened.
  useEffect(() => {
    setDraft((d) => ({ ...d, items: reconcileItems(d.items, d.hotelOptions, d.transfers, d.activities, currencies) }));
  }, [draft.hotelOptions, draft.transfers, draft.activities, currencies]);

  useEffect(() => {
    if (!draft.destinationId) {
      setCampaigns([]);
      return;
    }
    packagesApi.list({ pageSize: 1000, filter: { destinationId: draft.destinationId } }).then((res) => {
      if (res.success) setCampaigns(res.data.items);
    });
  }, [draft.destinationId]);

  // Prefill from ?leadId= when arriving from a Lead's "Create Quotation" button.
  useEffect(() => {
    if (initialId) return;
    const prefillLeadId = searchParams.get("leadId");
    if (!prefillLeadId) return;
    leadsApi.get(prefillLeadId).then((res) => {
      if (res.success && res.data) {
        patch({
          customer: {
            customerName: res.data.customerName,
            mobile: res.data.mobile,
            email: res.data.email ?? "",
            companyName: res.data.companyName ?? "",
          },
          destinationId: res.data.destinationId,
          source: res.data.source,
          travelDate: res.data.travelDate ? res.data.travelDate.slice(0, 10) : "",
          adults: res.data.adults ?? 1,
          children: res.data.children ?? 0,
        });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialId]);

  useEffect(() => {
    if (!initialId) return;
    (async () => {
      const res = await quotationsApi.get(initialId);
      if (res.success && res.data) {
        const q = res.data;
        setDraft({
          customer: {
            customerName: q.lead?.customerName ?? "",
            mobile: q.lead?.mobile ?? "",
            email: q.lead?.email ?? "",
            companyName: q.lead?.companyName ?? "",
          },
          destinationId: q.destinationId,
          campaignId: q.campaignId ?? "",
          travelDate: q.travelDate ? q.travelDate.slice(0, 10) : "",
          travelEndDate: q.travelEndDate ? q.travelEndDate.slice(0, 10) : "",
          days: q.days != null ? String(q.days) : "",
          nights: q.nights != null ? String(q.nights) : "",
          adults: q.adults,
          children: q.children,
          infants: q.infants,
          salesExecutiveId: q.salesExecutiveId ?? "",
          source: q.source ?? "",
          validUntil: q.validUntil ? q.validUntil.slice(0, 10) : "",
          internalNotes: q.internalNotes ?? "",
          itineraryMode: q.itineraryMode,
          itineraryDays: q.itineraryDays,
          hotelOptions: q.hotelOptions,
          transfers: q.transfers,
          activities: q.activities,
          inclusionsText: q.inclusionsText,
          exclusionsText: q.exclusionsText,
          includeChildCosting: q.includeChildCosting,
          marginPercent: q.marginPercent,
          gstPercent: q.gstPercent,
          advanceAmount: q.advanceAmount,
          items: q.items,
        });
        setStatus(q.status);
        setShareToken(q.shareToken ?? null);
        setPdfGeneratedAt(q.pdfGeneratedAt ? new Date(q.pdfGeneratedAt) : null);
        setLastUpdated(q.updatedDate);
        setExistingBookingId(q.bookings && q.bookings.length > 0 ? q.bookings[0].id : null);
      } else {
        notify(res.message || "Unable to load quotation", "error");
      }
      skipNextAutoSaveRef.current = true;
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialId]);

  // Auto-save Hotels/Transfers/Activities as the user edits them — the other steps still rely
  // on the explicit Save Draft/Save & Next buttons. Skipped while there's no id yet (nothing to
  // PUT to) or right after a fresh load (that's not a user edit).
  useEffect(() => {
    if (!id || loading) return;
    if (skipNextAutoSaveRef.current) {
      skipNextAutoSaveRef.current = false;
      return;
    }
    setAutoSaveStatus("saving");
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(async () => {
      if (saving) return;
      try {
        const res = await quotationsApi.update(id, buildPayload());
        if (!res.success) {
          setAutoSaveStatus("error");
          notify(res.message || "Auto-save failed — use Save Draft", "error");
          return;
        }
        setAutoSaveStatus("saved");
      } catch (error) {
        setAutoSaveStatus("error");
        notify(error instanceof Error ? error.message : "Auto-save failed — use Save Draft", "error");
      }
    }, 1500);
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.hotelOptions, draft.transfers, draft.activities]);

  // Selecting an Itinerary Template pre-loads Steps 2–6 from the campaign's own content
  // (only for a fresh/empty builder — see hasManualRows guard below).
  const applyTemplate = async (nextCampaignId: string) => {
    patch({ campaignId: nextCampaignId });
    if (!nextCampaignId) return;
    const hasManualRows = draft.items.some((it) => !it.sourceId);
    if (hasManualRows) return;

    const res = await packagesApi.get(nextCampaignId);
    if (!res.success || !res.data) return;
    const campaign = res.data;
    // Package cost isn't presettable here anymore — it now flows through the per-hotel rows added in the Hotels step.
    if (campaign.insurancePrice > 0) {
      patch({ items: [...draft.items, { component: "Insurance", detail: "Travel insurance", qty: 1, cost: campaign.insurancePrice, sortOrder: draft.items.length }] });
    }

    const [itineraryRes, hotelPlanRes, transferPlanRes, hotelMastersRes, transferTypesRes] = await Promise.all([
      itinerariesApi.list({ filter: { packageId: nextCampaignId }, pageSize: 1 }),
      hotelsApi.list({ filter: { packageId: nextCampaignId }, pageSize: 1 }),
      transfersApi.list({ filter: { packageId: nextCampaignId }, pageSize: 1 }),
      hotelMasterApi.all(),
      transferTypesApi.list({ pageSize: 1000 }),
    ]);

    const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const campaignDays = itineraryRes.success ? itineraryRes.data.items[0]?.days ?? [] : [];
    const campaignHotels = hotelPlanRes.success ? hotelPlanRes.data.items[0]?.hotels ?? [] : [];
    const campaignTransfers = transferPlanRes.success ? transferPlanRes.data.items[0]?.transfers ?? [] : [];
    const hotelMasters = hotelMastersRes.success ? hotelMastersRes.data : [];
    const transferTypes = transferTypesRes.success ? transferTypesRes.data.items : [];

    const itineraryDays: QuotationItineraryDay[] = campaignDays.map((d, i) => ({
      id: newId(),
      dayNumber: d.order ?? i + 1,
      title: d.title || `Day ${i + 1}`,
      description: d.description ?? "",
      images: d.dayImage ? [d.dayImage] : [],
      meals: d.mealsIncluded ?? [],
      notes: [d.stayDetails, d.transportDetails, d.activities?.length ? `Activities: ${d.activities.join(", ")}` : ""]
        .filter(Boolean)
        .join(" · "),
    }));

    const hotelSelections: QuotationHotelSelection[] = campaignHotels.map((h) => {
      const master = h.hotelMasterId ? hotelMasters.find((m) => m.id === h.hotelMasterId) : undefined;
      return {
        id: newId(),
        hotelMasterId: h.hotelMasterId ?? null,
        hotelName: h.name || master?.name || "",
        images: (h.images?.length ? h.images : master?.images) ?? [],
        description: h.description || master?.description || "",
        category: master?.category ?? null,
        roomType: h.roomType || master?.roomTypes[0] || "",
        mealPlan: master?.mealPlans[0] ?? "",
        amenities: master?.amenities ?? [],
        googleMapUrl: master?.googleMapUrl ?? null,
        website: master?.website ?? null,
        checkIn: "",
        checkOut: "",
        rooms: 1,
        nights: 1,
      };
    });
    const hotelOptions: QuotationHotelOptionGroup[] =
      hotelSelections.length > 0 ? [{ id: newId(), label: "Option A", hotels: hotelSelections }] : [];

    const transfers: QuotationTransferItem[] = campaignTransfers.map((t) => {
      const type = t.transferTypeId ? transferTypes.find((tt) => tt.id === t.transferTypeId) : undefined;
      return {
        id: newId(),
        name: type?.name ?? "Transfer",
        description: "",
        images: type?.imageUrl ? [type.imageUrl] : [],
        pickupLocation: t.from,
        dropLocation: t.to,
        vehicleType: type?.name ?? "",
        mode: "Private",
        transferDate: "",
        duration: "",
        pickupTime: "",
        dropTime: "",
        status: "Included",
        notes: "",
      };
    });

    const activities: QuotationActivityItem[] = campaign.activities.map((a) => ({
      id: newId(),
      name: a.title,
      description: "",
      images: [],
      activityDate: "",
      duration: "",
      reportingTime: "",
      activityTime: "",
      pax: 1,
      notes: "",
    }));

    patch({
      itineraryDays: itineraryDays.length > 0 ? itineraryDays : draft.itineraryDays,
      hotelOptions: hotelOptions.length > 0 ? hotelOptions : draft.hotelOptions,
      transfers: transfers.length > 0 ? transfers : draft.transfers,
      activities: activities.length > 0 ? activities : draft.activities,
      inclusionsText: campaign.inclusionsText || draft.inclusionsText,
      exclusionsText: campaign.exclusionsText || draft.exclusionsText,
    });
  };

  const buildPayload = () => ({
    customer: draft.customer,
    destinationId: draft.destinationId,
    campaignId: draft.campaignId || null,
    travelDate: draft.travelDate || null,
    travelEndDate: draft.travelEndDate || null,
    days: draft.days === "" ? null : Number(draft.days),
    nights: draft.nights === "" ? null : Number(draft.nights),
    adults: draft.adults,
    children: draft.children,
    infants: draft.infants,
    salesExecutiveId: draft.salesExecutiveId || null,
    source: draft.source || null,
    validUntil: draft.validUntil || null,
    internalNotes: draft.internalNotes || null,
    marginPercent: draft.marginPercent,
    gstPercent: draft.gstPercent,
    items: draft.items.map((r, i) => ({ ...r, sortOrder: i })),
    itineraryMode: draft.itineraryMode,
    itineraryDays: draft.itineraryDays,
    hotelOptions: draft.hotelOptions,
    transfers: draft.transfers,
    activities: draft.activities,
    inclusionsText: draft.inclusionsText,
    exclusionsText: draft.exclusionsText,
    includeChildCosting: draft.includeChildCosting,
    advanceAmount: draft.advanceAmount,
  });

  const canSaveStep1 =
    !!draft.customer.customerName.trim() &&
    !!draft.customer.mobile.trim() &&
    !!draft.destinationId &&
    !!draft.travelDate &&
    !!draft.travelEndDate;

  /** Persists the whole draft — create on first save, update afterwards. Used by "Save & Next" and the top-level Save Draft button. */
  const persist = async (): Promise<string | null> => {
    if (!canSaveStep1) {
      notify("Customer name, mobile, destination, travel date and travel end date are required", "error");
      return null;
    }
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    setSaving(true);
    try {
      if (id) {
        const res = await quotationsApi.update(id, buildPayload());
        if (!res.success) {
          notify(res.message || "Unable to save quotation", "error");
          return null;
        }
        if (res.data?.updatedDate) setLastUpdated(res.data.updatedDate);
        setAutoSaveStatus("saved");
        return id;
      }
      const res = await quotationsApi.create(buildPayload());
      if (!res.success || !res.data) {
        notify(res.message || "Unable to create quotation", "error");
        return null;
      }
      setId(res.data.id);
      setLastUpdated(res.data.updatedDate);
      router.replace(`/admin/quotations/${res.data.id}/edit`);
      return res.data.id;
    } finally {
      setSaving(false);
    }
  };

  const goNext = async () => {
    const savedId = await persist();
    if (!savedId) return;
    if (step === 0) notify("Quotation saved as Draft", "success");
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const withBusy = async (key: string, fn: () => Promise<void>) => {
    setBusyAction(key);
    try {
      await fn();
    } finally {
      setBusyAction(null);
    }
  };

  const generatePdf = () =>
    withBusy("pdf", async () => {
      const savedId = await persist();
      if (!savedId) return;
      window.open(`/api/admin/quotations/${savedId}/pdf`, "_blank");
      setPdfGeneratedAt(new Date());
    });

  const downloadPdf = () =>
    withBusy("pdf-download", async () => {
      const savedId = await persist();
      if (!savedId) return;
      window.open(`/api/admin/quotations/${savedId}/pdf?download=1`, "_blank");
    });

  const generateLink = () =>
    withBusy("link", async () => {
      const savedId = await persist();
      if (!savedId) return;
      const res = await quotationsApi.generateShareLink(savedId);
      if (!res.success || !res.data) return notify(res.message || "Unable to generate link", "error");
      setShareToken(res.data.token);
      setStatus("Sent");
      await navigator.clipboard.writeText(res.data.url).catch(() => {});
      notify("Shareable link generated and copied to clipboard", "success");
    });

  const copyShareLink = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl).catch(() => {});
    notify("Shareable link copied to clipboard", "success");
  };

  const duplicate = () =>
    withBusy("duplicate", async () => {
      if (!id) return;
      const res = await quotationsApi.duplicate(id);
      if (!res.success || !res.data) return notify(res.message || "Unable to duplicate", "error");
      notify("Quotation duplicated", "success");
      router.push(`/admin/quotations/${res.data.id}/edit`);
    });

  /** Opens the advance-payment collection dialog — the actual conversion runs from there, in confirmConvertToBooking.
   * Gated on the quotation actually declaring an Advance Amount (Pricing step) — that field is the
   * source of truth for "what advance is required to confirm this booking", not just a hint. */
  const openConvertModal = () => {
    if (!draft.advanceAmount || draft.advanceAmount <= 0) {
      return setConvertGateError(
        `Set an Advance Amount on the Pricing step before converting into a booking (suggested: ${formatINR(advanceSuggested)}).`,
      );
    }
    setConvertFormError(null);
    setConvertPayment({
      paymentDate: todayIso(),
      paymentMode: "Cash",
      amount: draft.advanceAmount,
      transactionReference: "",
      referenceImageUrl: "",
      remarks: "",
    });
    setConvertModalOpen(true);
  };

  /** Creates a real Booking record from this quotation (Lead, destination, travel date, selling price),
   * records the collected advance payment against it, then hands off to the Operations Workspace. */
  const confirmConvertToBooking = () => {
    if (!convertPayment.paymentDate || convertPayment.amount <= 0) {
      return setConvertFormError("Payment date and a payment amount greater than zero are required.");
    }
    if (convertPayment.amount < draft.advanceAmount) {
      return setConvertFormError(`The payment amount must be at least the declared Advance Amount (${formatINR(draft.advanceAmount)}).`);
    }
    setConvertFormError(null);
    return withBusy("convert", async () => {
      const savedId = await persist();
      if (!savedId) return;
      const res = await quotationsApi.get(savedId);
      if (!res.success || !res.data) return notify(res.message || "Unable to load quotation", "error");
      const bookingRes = await bookingsApi.create({
        leadId: res.data.leadId,
        quotationId: savedId,
        destinationId: res.data.destinationId,
        travelDate: res.data.travelDate ? res.data.travelDate.slice(0, 10) : null,
        totalAmount: sellingPrice,
      });
      if (!bookingRes.success || !bookingRes.data) return notify(bookingRes.message || "Unable to create booking", "error");
      const paymentRes = await bookingsApi.addCustomerPayment(bookingRes.data.id, {
        paymentDate: convertPayment.paymentDate,
        paymentMode: convertPayment.paymentMode,
        amount: convertPayment.amount,
        transactionReference: convertPayment.transactionReference || null,
        referenceImageUrl: convertPayment.referenceImageUrl || null,
        remarks: convertPayment.remarks || null,
      });
      if (!paymentRes.success) {
        notify(`Booking created, but the payment could not be recorded: ${paymentRes.message || "unknown error"}`, "error");
      } else {
        notify("Booking created and advance payment recorded", "success");
      }
      setConvertModalOpen(false);
      router.push(`/admin/bookings/${bookingRes.data.id}`);
    });
  };

  // Costing helpers (Step 6 — unchanged pricing logic).
  const updateItem = (index: number, itemPatch: Partial<AdminQuotationItem>) => {
    patch({ items: draft.items.map((r, i) => (i === index ? { ...r, ...itemPatch } : r)) });
  };
  const changeItemCurrency = (index: number, code: string) => {
    if (code === "INR") {
      updateItem(index, { currencyCode: "INR", exchangeRate: 1, foreignAmount: null });
      return;
    }
    const currency = currencies.find((c) => c.code === code);
    const rate = currency?.exchangeRate ?? 1;
    patch({
      items: draft.items.map((r, i) =>
        i === index ? { ...r, currencyCode: code, exchangeRate: rate, cost: Math.round((r.foreignAmount ?? 0) * rate) } : r,
      ),
    });
  };
  const changeItemForeignAmount = (index: number, amount: number) => {
    patch({ items: draft.items.map((r, i) => (i === index ? { ...r, foreignAmount: amount, cost: Math.round(amount * r.exchangeRate!) } : r)) });
  };
  const addRow = () => patch({ items: [...draft.items, emptyItemRow(draft.items.length)] });
  const removeRow = (index: number) => patch({ items: draft.items.filter((_, i) => i !== index) });

  // Pricing rows for Hotels/Activities/Transfers are looked up (not indexed) by the source hotel/activity/transfer id.
  const sourceItem = (sourceId: string) => draft.items.find((it) => it.sourceId === sourceId);
  const sourceIndex = (sourceId: string) => draft.items.findIndex((it) => it.sourceId === sourceId);
  const changeSourceCurrency = (sourceId: string, code: string) => {
    const idx = sourceIndex(sourceId);
    if (idx !== -1) changeItemCurrency(idx, code);
  };
  const changeSourceForeignAmount = (sourceId: string, amount: number) => {
    const idx = sourceIndex(sourceId);
    if (idx !== -1) changeItemForeignAmount(idx, amount);
  };
  const changeSourceCostDirect = (sourceId: string, cost: number) => {
    const idx = sourceIndex(sourceId);
    if (idx !== -1) updateItem(idx, { cost });
  };

  /** Currency + Supplier Cost (editable) + auto-computed Total — reused by the Hotel/Activity/Transfer pricing tables. */
  const pricingCells = (sourceId: string) => {
    const item = sourceItem(sourceId);
    const currencyCode = item?.currencyCode ?? "USD";
    const cost = item?.cost ?? 0;
    const qty = item?.qty ?? 0;
    return (
      <>
        <td className="px-3 py-2">
          <select className={selectCls} value={currencyCode} onChange={(e) => changeSourceCurrency(sourceId, e.target.value)}>
            <option value="INR">INR</option>
            {currencies.filter((c) => c.code !== "INR").map((c) => (
              <option key={c.code} value={c.code}>{c.code}</option>
            ))}
          </select>
        </td>
        <td className="px-3 py-2">
          {currencyCode === "INR" ? (
            <input type="number" min={0} className={inputCls} value={cost} onChange={(e) => changeSourceCostDirect(sourceId, Number(e.target.value) || 0)} />
          ) : (
            <div>
              <input type="number" min={0} className={inputCls} value={item?.foreignAmount ?? 0} onChange={(e) => changeSourceForeignAmount(sourceId, Number(e.target.value) || 0)} />
              <p className="mt-1 text-xs text-slate-400">≈ {formatINR(cost)}</p>
            </div>
          )}
        </td>
        <td className="px-3 py-2 text-right font-semibold text-slate-900">{formatINR(qty * cost)}</td>
      </>
    );
  };

  const totalCost = draft.items.reduce((sum, r) => sum + r.qty * r.cost, 0);
  const marginValue = Math.round(totalCost * (draft.marginPercent / 100));
  const preGstSubtotal = totalCost + marginValue;
  const gstValue = Math.round(preGstSubtotal * (draft.gstPercent / 100));
  const sellingPrice = preGstSubtotal + gstValue;
  const advanceSuggested = Math.round(sellingPrice * 0.2);

  const busyLabels: Record<string, string> = {
    pdf: "Generating PDF…",
    "pdf-download": "Preparing download…",
    link: "Generating link…",
    duplicate: "Duplicating quotation…",
    convert: "Creating booking…",
  };
  const anyBusy = saving || busyAction !== null;
  const busyLabel = busyAction ? busyLabels[busyAction] ?? "Working…" : "Saving quotation…";

  const shareUrl = shareToken && typeof window !== "undefined" ? `${window.location.origin}/quote/${shareToken}` : null;
  const formatDateTime = (value: Date | string) =>
    new Date(value).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).replace(",", " ·");

  if (loading) {
    return (
      <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center text-sm text-slate-500">
        <span className="inline-block w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2 align-middle" />
        Loading…
      </div>
    );
  }

  return (
    <div className="relative grid grid-cols-1 lg:grid-cols-[220px_1fr_260px] gap-6">
      <LoadingOverlay show={anyBusy} label={busyLabel} />
      {/* Actions panel (left) */}
      <div className="rounded-2xl bg-white border border-slate-200 p-4 h-fit space-y-2 order-2 lg:order-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Actions</h3>
        <button type="button" onClick={() => persist()} disabled={anyBusy} className="w-full inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
          {saving ? <span className="inline-block w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />} {saving ? "Saving…" : "Save Draft"}
        </button>
        {id && autoSaveStatus !== "idle" && (
          <div className="flex items-center gap-1.5 px-0.5 text-[11px] text-slate-400" aria-live="polite">
            {autoSaveStatus === "saving" && (
              <>
                <span className="inline-block w-3 h-3 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                Auto-saving Hotels/Transfers/Activities…
              </>
            )}
            {autoSaveStatus === "saved" && (
              <>
                <Check className="w-3 h-3 text-emerald-500" />
                All changes saved
              </>
            )}
            {autoSaveStatus === "error" && <span className="text-rose-500">Auto-save failed — use Save Draft</span>}
          </div>
        )}
        <button type="button" onClick={generatePdf} disabled={anyBusy} className="w-full inline-flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
          <span className="inline-flex items-center gap-2">
            {busyAction === "pdf" ? <span className="inline-block w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" /> : <FileDown className="w-4 h-4" />} {busyAction === "pdf" ? "Generating…" : "Generate PDF"}
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">PDF</span>
        </button>
        {pdfGeneratedAt && (
          <button type="button" onClick={downloadPdf} disabled={anyBusy} className="w-full inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            {busyAction === "pdf-download" ? <span className="inline-block w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" /> : <Download className="w-4 h-4" />} {busyAction === "pdf-download" ? "Preparing…" : "Download PDF"}
          </button>
        )}
        <button type="button" onClick={generateLink} disabled={anyBusy} className="w-full inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
          {busyAction === "link" ? <span className="inline-block w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" /> : <Share2 className="w-4 h-4" />} {busyAction === "link" ? "Working…" : "Share Link"}
        </button>
        {shareToken && (
          <div className="flex items-center gap-1.5 px-0.5 text-[11px] text-emerald-600 font-medium">
            <Check className="w-3 h-3" /> Link generated
          </div>
        )}
        {shareToken && (
          <button type="button" onClick={copyShareLink} disabled={anyBusy} className="w-full inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            <Copy className="w-4 h-4" /> Copy Shareable Link
          </button>
        )}
        {id && (
          <button type="button" onClick={duplicate} disabled={anyBusy} className="w-full inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            {busyAction === "duplicate" ? <span className="inline-block w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" /> : <Copy className="w-4 h-4" />} {busyAction === "duplicate" ? "Duplicating…" : "Duplicate"}
          </button>
        )}

        {(shareToken || pdfGeneratedAt) && (
          <div className="pt-3 mt-1 border-t border-slate-100 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Document Status</h3>
            {shareToken && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Shareable Link
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Generated</span>
                </div>
                {shareUrl && (
                  <div className="flex items-center gap-1.5 pl-5">
                    <Link href={`/quote/${shareToken}`} target="_blank" className="text-[11px] text-cyan-700 hover:underline truncate">
                      {shareUrl}
                    </Link>
                    <button type="button" onClick={copyShareLink} className="text-slate-400 hover:text-slate-600 flex-shrink-0" aria-label="Copy link">
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            )}
            {pdfGeneratedAt && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
                    <FileText className="w-3.5 h-3.5 text-rose-500" /> PDF Document
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Generated</span>
                </div>
                <div className="pl-5 text-[11px] text-slate-400">Generated on {formatDateTime(pdfGeneratedAt)}</div>
              </div>
            )}
          </div>
        )}

        {id && (
          <div className="text-xs text-slate-400 pt-2 border-t border-slate-100 mt-2 space-y-0.5">
            <div>
              Status: <span className="font-semibold text-blue-600">{status}</span>
            </div>
            {lastUpdated && <div>Last updated: {formatDateTime(lastUpdated)}</div>}
          </div>
        )}
      </div>

      {/* Stepper + step content (center) */}
      <div className="space-y-6 order-1 lg:order-2">
        <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-900">{id ? "Edit Quotation" : "New Quotation"}</h2>
            <Link href="/admin/leads" className="px-4 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100">
              Cancel
            </Link>
          </div>
          <div className="flex items-center overflow-x-auto px-4 py-3 gap-1 bg-slate-50/60">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const reachable = i === 0 || (!!id && canSaveStep1);
              const active = i === step;
              return (
                <button
                  key={s.key}
                  type="button"
                  disabled={!reachable}
                  onClick={() => reachable && setStep(i)}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    active ? "bg-blue-600 text-white shadow-sm" : reachable ? "text-slate-600 hover:bg-slate-100" : "text-slate-300 cursor-not-allowed"
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${active ? "bg-white/20" : "bg-slate-200"}`}>
                    {i < step || (i === 0 && id) ? <Check className="w-3 h-3" /> : i + 1}
                  </span>
                  <Icon className="w-3.5 h-3.5" /> {s.label}
                </button>
              );
            })}
          </div>

          <div className="p-6">
            {step === 0 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-3">Customer Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Customer Name" required>
                      <input className={inputCls} value={draft.customer.customerName} onChange={(e) => patch({ customer: { ...draft.customer, customerName: e.target.value } })} placeholder="Jane Doe" />
                    </Field>
                    <Field label="Mobile Number" required>
                      <input className={inputCls} value={draft.customer.mobile} onChange={(e) => patch({ customer: { ...draft.customer, mobile: e.target.value } })} placeholder="+91 98765 43210" />
                    </Field>
                    <Field label="Email Address">
                      <input type="email" className={inputCls} value={draft.customer.email ?? ""} onChange={(e) => patch({ customer: { ...draft.customer, email: e.target.value } })} />
                    </Field>
                    <Field label="Company Name" hint="Optional">
                      <input className={inputCls} value={draft.customer.companyName ?? ""} onChange={(e) => patch({ customer: { ...draft.customer, companyName: e.target.value } })} />
                    </Field>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-3">Trip Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Field label="Destination" required className="md:col-span-2">
                      <select className={selectCls} value={draft.destinationId} onChange={(e) => patch({ destinationId: e.target.value, campaignId: "" })}>
                        <option value="">Select destination</option>
                        {destinations.map((d) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Travel Date" required hint="Must be a future date">
                      <DateInput
                        min={tomorrowIso()}
                        value={draft.travelDate}
                        onChange={(value) => {
                          if (value && !isFutureDate(value)) {
                            notify("Travel date must be after today", "error");
                            return;
                          }
                          patch({ travelDate: value });
                        }}
                      />
                    </Field>
                    <Field label="Travel End Date" required hint="Must be a future date">
                      <DateInput
                        min={tomorrowIso()}
                        value={draft.travelEndDate}
                        onChange={(value) => {
                          if (value && !isFutureDate(value)) {
                            notify("Travel end date must be after today", "error");
                            return;
                          }
                          patch({ travelEndDate: value });
                        }}
                      />
                    </Field>
                    <Field label="Days">
                      <input type="number" min={0} className={inputCls} value={draft.days} onChange={(e) => patch({ days: e.target.value })} />
                    </Field>
                    <Field label="Nights">
                      <input type="number" min={0} className={inputCls} value={draft.nights} onChange={(e) => patch({ nights: e.target.value })} />
                    </Field>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-3">Traveller Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Field label="Adults">
                      <input type="number" min={1} className={inputCls} value={draft.adults} onChange={(e) => patch({ adults: Number(e.target.value) || 1 })} />
                    </Field>
                    <Field label="Children">
                      <input type="number" min={0} className={inputCls} value={draft.children} onChange={(e) => patch({ children: Number(e.target.value) || 0 })} />
                    </Field>
                    <Field label="Infants">
                      <input type="number" min={0} className={inputCls} value={draft.infants} onChange={(e) => patch({ infants: Number(e.target.value) || 0 })} />
                    </Field>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-3">Other Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Field label="Sales Executive" hint="Defaults to you">
                      <UserSearchSelect
                        users={salesUsers}
                        value={draft.salesExecutiveId}
                        onChange={(v) => patch({ salesExecutiveId: v })}
                        placeholder="Search Sales Executive…"
                      />
                    </Field>
                    <Field label="Lead Source">
                      <select className={selectCls} value={draft.source} onChange={(e) => patch({ source: e.target.value as LeadSource })}>
                        {SOURCES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Quotation Validity">
                      <DateInput value={draft.validUntil} onChange={(iso) => patch({ validUntil: iso })} />
                    </Field>
                  </div>
                  <Field label="Internal Notes" hint="Visible only to Admin/Sales — never shown to the customer" className="mt-4">
                    <textarea className={textareaCls} value={draft.internalNotes} onChange={(e) => patch({ internalNotes: e.target.value })} />
                  </Field>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Build itinerary from</span>
                  <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden">
                    <button type="button" onClick={() => patch({ itineraryMode: "template" })} className={`px-3 py-1.5 text-xs font-semibold ${draft.itineraryMode === "template" ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}>
                      Package Template
                    </button>
                    <button type="button" onClick={() => patch({ itineraryMode: "custom" })} className={`px-3 py-1.5 text-xs font-semibold ${draft.itineraryMode === "custom" ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}>
                      Custom Itinerary
                    </button>
                  </div>
                </div>

                {draft.itineraryMode === "template" && (
                  <Field label="Itinerary Template" hint="Copies the campaign's day-wise plan in — you can still edit it below">
                    <select
                      className={selectCls}
                      value={draft.campaignId}
                      onChange={(e) => {
                        const campaignId = e.target.value;
                        applyTemplate(campaignId);
                        if (campaignId && draft.itineraryDays.length === 0) patch({ itineraryDays: [newQuotationDay(1)] });
                      }}
                      disabled={!draft.destinationId}
                    >
                      <option value="">Select template</option>
                      {campaigns.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </Field>
                )}

                <QuotationItineraryDaysEditor days={draft.itineraryDays} onChange={(itineraryDays) => patch({ itineraryDays })} />
              </div>
            )}

            {step === 2 && (
              <QuotationHotelOptionsEditor
                options={draft.hotelOptions}
                onChange={(hotelOptions) => patch({ hotelOptions })}
                destinationId={draft.destinationId}
                minDate={draft.travelDate}
                maxDate={draft.travelEndDate}
              />
            )}

            {step === 3 && (
              <QuotationTransfersEditor
                transfers={draft.transfers}
                onChange={(transfers) => patch({ transfers })}
                minDate={draft.travelDate}
                maxDate={draft.travelEndDate}
              />
            )}

            {step === 4 && (
              <QuotationActivitiesEditor
                activities={draft.activities}
                onChange={(activities) => patch({ activities })}
                destinationId={draft.destinationId}
                minDate={draft.travelDate}
                maxDate={draft.travelEndDate}
              />
            )}

            {step === 5 && (
              <div className="space-y-6">
                <p className="text-xs text-slate-500">One line per bullet point — shown to the customer on the PDF and shareable link.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Field label="Inclusions">
                    <textarea
                      className={`${textareaCls} min-h-[220px]`}
                      value={draft.inclusionsText}
                      onChange={(e) => patch({ inclusionsText: e.target.value })}
                      placeholder={"4 Nights accommodation\nAll meals (Breakfast, Lunch, Dinner)\nAirport transfers"}
                    />
                  </Field>
                  <Field label="Exclusions">
                    <textarea
                      className={`${textareaCls} min-h-[220px]`}
                      value={draft.exclusionsText}
                      onChange={(e) => patch({ exclusionsText: e.target.value })}
                      placeholder={"International airfare\nPersonal expenses\nTravel insurance"}
                    />
                  </Field>
                </div>
              </div>
            )}

            {step === 6 && (
              <div className="space-y-6">
                <p className="text-xs text-slate-500">
                  Every hotel, transfer and activity added in the earlier steps shows up here automatically — just fill in Currency and Supplier Cost for each.
                </p>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-2">Hotels</h3>
                  {draft.hotelOptions.some((g) => g.hotels.length > 0) ? (
                    <div className="overflow-x-auto rounded-xl border border-slate-100">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-xs font-semibold text-slate-500 uppercase border-b border-slate-100">
                            <th className="px-3 py-2 w-16">Option</th>
                            <th className="px-3 py-2">Hotel Name</th>
                            <th className="px-3 py-2 w-20">Nights</th>
                            <th className="px-3 py-2 w-20">Rooms</th>
                            <th className="px-3 py-2 w-24">Currency</th>
                            <th className="px-3 py-2 w-36">Supplier Cost</th>
                            <th className="px-3 py-2 w-32 text-right">Total Cost</th>
                          </tr>
                        </thead>
                        <tbody>
                          {draft.hotelOptions.flatMap((g) =>
                            g.hotels.map((h) => (
                              <tr key={h.id} className="border-b border-slate-50">
                                <td className="px-3 py-2 text-xs text-slate-500">{g.label}</td>
                                <td className="px-3 py-2">
                                  <input className={inputCls} value={h.hotelName} disabled />
                                </td>
                                <td className="px-3 py-2">
                                  <input className={inputCls} value={h.nights} disabled />
                                </td>
                                <td className="px-3 py-2">
                                  <input className={inputCls} value={h.rooms} disabled />
                                </td>
                                {pricingCells(h.id)}
                              </tr>
                            )),
                          )}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No hotels added yet — go to the Hotels step to add one.</p>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-2">Activities</h3>
                  {draft.activities.length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-slate-100">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-xs font-semibold text-slate-500 uppercase border-b border-slate-100">
                            <th className="px-3 py-2">Activity Name</th>
                            <th className="px-3 py-2 w-24">No. of Pax</th>
                            <th className="px-3 py-2 w-24">Currency</th>
                            <th className="px-3 py-2 w-36">Supplier Cost</th>
                            <th className="px-3 py-2 w-32 text-right">Total Cost</th>
                          </tr>
                        </thead>
                        <tbody>
                          {draft.activities.map((a) => (
                            <tr key={a.id} className="border-b border-slate-50">
                              <td className="px-3 py-2">
                                <input className={inputCls} value={a.name} disabled />
                              </td>
                              <td className="px-3 py-2">
                                <input className={inputCls} value={a.pax} disabled />
                              </td>
                              {pricingCells(a.id)}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No activities added yet — go to the Activities step to add one.</p>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-2">Transfers</h3>
                  {draft.transfers.length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-slate-100">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-xs font-semibold text-slate-500 uppercase border-b border-slate-100">
                            <th className="px-3 py-2">Transfer Name</th>
                            <th className="px-3 py-2 w-32">Vehicle Type</th>
                            <th className="px-3 py-2 w-24">Private/SIC</th>
                            <th className="px-3 py-2 w-24">Currency</th>
                            <th className="px-3 py-2 w-36">Supplier Cost</th>
                            <th className="px-3 py-2 w-32 text-right">Total Cost</th>
                          </tr>
                        </thead>
                        <tbody>
                          {draft.transfers.map((t) => (
                            <tr key={t.id} className="border-b border-slate-50">
                              <td className="px-3 py-2">
                                <input className={inputCls} value={t.name} disabled />
                              </td>
                              <td className="px-3 py-2">
                                <input className={inputCls} value={t.vehicleType} disabled />
                              </td>
                              <td className="px-3 py-2">
                                <input className={inputCls} value={t.mode} disabled />
                              </td>
                              {pricingCells(t.id)}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No transfers added yet — go to the Transfers step to add one.</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-slate-900">Other Components</h3>
                    <button type="button" onClick={addRow} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200">
                      <Plus className="w-3.5 h-3.5" /> Add Row
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">Visa, insurance, flights — anything not already captured above.</p>
                  <div className="overflow-x-auto rounded-xl border border-slate-100">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs font-semibold text-slate-500 uppercase border-b border-slate-100">
                          <th className="px-4 py-2 w-36">Component</th>
                          <th className="px-4 py-2">Detail</th>
                          <th className="px-4 py-2 w-24">Currency</th>
                          <th className="px-4 py-2 w-40">Supplier Cost</th>
                          <th className="px-4 py-2 w-10" />
                        </tr>
                      </thead>
                      <tbody>
                        {draft.items.map((row, i) =>
                          row.sourceId ? null : (
                            <tr key={i} className="border-b border-slate-50">
                              <td className="px-4 py-2">
                                <select className={selectCls} value={row.component} onChange={(e) => updateItem(i, { component: e.target.value as QuotationComponentType })}>
                                  {MANUAL_COMPONENTS.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-4 py-2">
                                <input className={inputCls} value={row.detail} onChange={(e) => updateItem(i, { detail: e.target.value })} placeholder="e.g. Group visa fee" />
                              </td>
                              <td className="px-4 py-2">
                                <select className={selectCls} value={row.currencyCode ?? "INR"} onChange={(e) => changeItemCurrency(i, e.target.value)}>
                                  <option value="INR">INR</option>
                                  {currencies.filter((c) => c.code !== "INR").map((c) => (
                                    <option key={c.code} value={c.code}>{c.code}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-4 py-2">
                                {(row.currencyCode ?? "INR") === "INR" ? (
                                  <input type="number" min={0} className={inputCls} value={row.cost} onChange={(e) => updateItem(i, { cost: Number(e.target.value) || 0 })} />
                                ) : (
                                  <div>
                                    <input type="number" min={0} className={inputCls} value={row.foreignAmount ?? 0} onChange={(e) => changeItemForeignAmount(i, Number(e.target.value) || 0)} placeholder={`Cost in ${row.currencyCode}`} />
                                    <p className="mt-1 text-xs text-slate-400">≈ {formatINR(row.cost)} (rate {row.exchangeRate})</p>
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-2 text-right">
                                <button type="button" onClick={() => removeRow(i)} className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50" aria-label="Delete row">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    checked={draft.includeChildCosting}
                    onChange={(e) => patch({ includeChildCosting: e.target.checked })}
                  />
                  Include child count for costing
                </label>

                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 flex flex-col md:flex-row md:items-end gap-4">
                  <Field
                    label="Advance Amount (INR)"
                    hint={`20% of the quotation amount is required to confirm the booking — that's ${formatINR(advanceSuggested)}.`}
                    className="flex-1 !mb-0"
                  >
                    <input
                      type="number"
                      min={0}
                      className={inputCls}
                      value={draft.advanceAmount}
                      onChange={(e) => patch({ advanceAmount: Number(e.target.value) || 0 })}
                      placeholder={String(advanceSuggested)}
                    />
                  </Field>
                  {existingBookingId ? (
                    <Link
                      href={`/admin/bookings/${existingBookingId}`}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-semibold whitespace-nowrap"
                    >
                      <Check className="w-4 h-4" /> Booking Converted
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={openConvertModal}
                      disabled={anyBusy}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 whitespace-nowrap"
                    >
                      {busyAction === "convert" ? <span className="inline-block w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" /> : <Briefcase className="w-4 h-4" />} {busyAction === "convert" ? "Creating…" : "Convert into Booking"}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/40">
            <button type="button" onClick={goBack} disabled={step === 0} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={goNext}
                disabled={anyBusy || (step === 0 && !canSaveStep1)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {saving && <span className="inline-block w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />}
                {step === 0 ? (saving ? "Saving…" : "Save & Next") : "Next"} <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button type="button" onClick={() => persist()} disabled={anyBusy} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50">
                {saving ? <span className="inline-block w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />} {saving ? "Saving…" : "Save Quotation"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Margin & Selling Price panel (right) */}
      <div className="rounded-2xl bg-white border border-slate-200 p-5 h-fit space-y-4 order-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Margin &amp; Selling Price</h3>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Total Cost</span>
          <span className="font-semibold text-slate-900">{formatINR(totalCost)}</span>
        </div>
        <Field label="Margin %">
          <input type="number" min={0} step={0.5} className={inputCls} value={draft.marginPercent} onChange={(e) => patch({ marginPercent: Number(e.target.value) || 0 })} />
        </Field>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Margin Value</span>
          <span className="font-semibold text-slate-900">{formatINR(marginValue)}</span>
        </div>
        <Field label="GST %">
          <input type="number" min={0} step={0.5} className={inputCls} value={draft.gstPercent} onChange={(e) => patch({ gstPercent: Number(e.target.value) || 0 })} />
        </Field>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">GST Value</span>
          <span className="font-semibold text-slate-900">{formatINR(gstValue)}</span>
        </div>
        <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
          <span className="text-sm font-bold text-slate-900">Selling Price</span>
          <span className="text-lg font-bold text-emerald-700">{formatINR(sellingPrice)}</span>
        </div>
      </div>

      {convertGateError && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-rose-50 flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-4 h-4 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Advance Amount required</h3>
                  <p className="mt-1 text-sm text-slate-600">{convertGateError}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end px-5 py-3 bg-slate-50 border-t border-slate-100">
              <button type="button" onClick={() => setConvertGateError(null)} className="px-4 py-2 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800">
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {convertModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Record Advance Payment</h3>
              <button type="button" onClick={() => { setConvertModalOpen(false); setConvertFormError(null); }} className="text-slate-400 hover:text-slate-600" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-slate-500">
                Record the customer&apos;s advance payment before converting this quotation into a Booking. It&apos;s saved to the new Booking&apos;s Customer Payments.
              </p>
              {convertFormError && (
                <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700">
                  <span>{convertFormError}</span>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Payment Date" required>
                  <DateInput
                    value={convertPayment.paymentDate}
                    onChange={(iso) => setConvertPayment((p) => ({ ...p, paymentDate: iso }))}
                  />
                </Field>
                <Field label="Payment Mode">
                  <select
                    className={selectCls}
                    value={convertPayment.paymentMode}
                    onChange={(e) => setConvertPayment((p) => ({ ...p, paymentMode: e.target.value as PaymentMode }))}
                  >
                    {(["Cash", "BankTransfer", "Card", "UPI", "Cheque", "Other"] as PaymentMode[]).map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Amount" required hint={`Minimum ${formatINR(draft.advanceAmount)} (this quotation's declared Advance Amount)`}>
                  <input
                    type="number"
                    min={draft.advanceAmount}
                    className={inputCls}
                    value={convertPayment.amount}
                    onChange={(e) => setConvertPayment((p) => ({ ...p, amount: Number(e.target.value) || 0 }))}
                  />
                </Field>
                <Field label="Transaction Ref">
                  <input
                    className={inputCls}
                    value={convertPayment.transactionReference}
                    onChange={(e) => setConvertPayment((p) => ({ ...p, transactionReference: e.target.value }))}
                  />
                </Field>
              </div>
              <Field label="Reference Image">
                <ImageUpload
                  value={convertPayment.referenceImageUrl}
                  onChange={(url) => setConvertPayment((p) => ({ ...p, referenceImageUrl: url }))}
                  label="Upload"
                  compact
                />
              </Field>
              <Field label="Remarks">
                <input
                  className={inputCls}
                  value={convertPayment.remarks}
                  onChange={(e) => setConvertPayment((p) => ({ ...p, remarks: e.target.value }))}
                />
              </Field>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-3 bg-slate-50 border-t border-slate-100">
              <button type="button" onClick={() => { setConvertModalOpen(false); setConvertFormError(null); }} className="px-4 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100">
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmConvertToBooking}
                disabled={anyBusy}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
              >
                {busyAction === "convert" ? <span className="inline-block w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" /> : <Briefcase className="w-4 h-4" />}
                {busyAction === "convert" ? "Creating…" : "Confirm & Convert"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
