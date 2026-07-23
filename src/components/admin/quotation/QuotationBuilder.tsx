"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Trash2,
  FileDown,
  Mail,
  Share2,
  Copy,
  Save,
  Check,
  ArrowLeft,
  ArrowRight,
  User as UserIcon,
  Map as MapIcon,
  BedDouble,
  ArrowRightLeft,
  Ticket,
  Wallet,
} from "lucide-react";
import { Field, inputCls, selectCls, textareaCls } from "@/components/admin/ui/Field";
import { useToast } from "@/components/admin/ui/Toast";
import { currenciesApi, destinationsApi, leadsApi, packagesApi, quotationsApi, salesUsersApi } from "@/lib/adminApi";
import { useAuth } from "@/contexts/AuthContext";
import QuotationItineraryDaysEditor, { newQuotationDay } from "@/components/admin/quotation/QuotationItineraryDaysEditor";
import QuotationHotelOptionsEditor from "@/components/admin/quotation/QuotationHotelOptionsEditor";
import QuotationTransfersEditor from "@/components/admin/quotation/QuotationTransfersEditor";
import QuotationActivitiesEditor from "@/components/admin/quotation/QuotationActivitiesEditor";
import type {
  AdminCurrency,
  AdminDestination,
  AdminPackage,
  AdminQuotationItem,
  AdminSalesUser,
  LeadSource,
  QuotationActivityItem,
  QuotationComponentType,
  QuotationCustomerInput,
  QuotationHotelOptionGroup,
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
  marginPercent: number;
  gstPercent: number;
  items: AdminQuotationItem[];
}

const emptyDraft = (): Draft => ({
  customer: { customerName: "", mobile: "", email: "", companyName: "" },
  destinationId: "",
  campaignId: "",
  travelDate: "",
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
  marginPercent: 0,
  gstPercent: 5,
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

  const [destinations, setDestinations] = useState<AdminDestination[]>([]);
  const [campaigns, setCampaigns] = useState<AdminPackage[]>([]);
  const [currencies, setCurrencies] = useState<AdminCurrency[]>([]);
  const [salesUsers, setSalesUsers] = useState<AdminSalesUser[]>([]);

  const [loading, setLoading] = useState(!!initialId);
  const [saving, setSaving] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);

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
          marginPercent: q.marginPercent,
          gstPercent: q.gstPercent,
          items: q.items,
        });
        setStatus(q.status);
        setShareToken(q.shareToken ?? null);
      } else {
        notify(res.message || "Unable to load quotation", "error");
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialId]);

  // Selecting an Itinerary Template pre-loads default components (only for a fresh/empty builder).
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
  };

  const buildPayload = () => ({
    customer: draft.customer,
    destinationId: draft.destinationId,
    campaignId: draft.campaignId || null,
    travelDate: draft.travelDate || null,
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
  });

  const canSaveStep1 = !!draft.customer.customerName.trim() && !!draft.customer.mobile.trim() && !!draft.destinationId;

  /** Persists the whole draft — create on first save, update afterwards. Used by "Save & Next" and the top-level Save Draft button. */
  const persist = async (): Promise<string | null> => {
    if (!canSaveStep1) {
      notify("Customer name, mobile and destination are required", "error");
      return null;
    }
    setSaving(true);
    try {
      if (id) {
        const res = await quotationsApi.update(id, buildPayload());
        if (!res.success) {
          notify(res.message || "Unable to save quotation", "error");
          return null;
        }
        return id;
      }
      const res = await quotationsApi.create(buildPayload());
      if (!res.success || !res.data) {
        notify(res.message || "Unable to create quotation", "error");
        return null;
      }
      setId(res.data.id);
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
    });

  const sendEmail = () =>
    withBusy("email", async () => {
      const savedId = await persist();
      if (!savedId) return;
      const res = await quotationsApi.sendEmail(savedId);
      if (!res.success) return notify(res.message || "Unable to send email", "error");
      notify("Quotation emailed to the lead", "success");
      if (res.data) setStatus(res.data.status);
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
      notify("Shareable link copied to clipboard", "success");
    });

  const duplicate = () =>
    withBusy("duplicate", async () => {
      if (!id) return;
      const res = await quotationsApi.duplicate(id);
      if (!res.success || !res.data) return notify(res.message || "Unable to duplicate", "error");
      notify("Quotation duplicated", "success");
      router.push(`/admin/quotations/${res.data.id}/edit`);
    });

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

  if (loading) {
    return (
      <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center text-sm text-slate-500">
        Loading…
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_260px] gap-6">
      {/* Actions panel (left) */}
      <div className="rounded-2xl bg-white border border-slate-200 p-4 h-fit space-y-2 order-2 lg:order-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Actions</h3>
        <button type="button" onClick={() => persist()} disabled={saving} className="w-full inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
          <Save className="w-4 h-4" /> Save Draft
        </button>
        <button type="button" onClick={generatePdf} disabled={busyAction !== null} className="w-full inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
          <FileDown className="w-4 h-4" /> Generate PDF
        </button>
        <button type="button" onClick={sendEmail} disabled={busyAction !== null} className="w-full inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
          <Mail className="w-4 h-4" /> Send Email
        </button>
        <button type="button" onClick={generateLink} disabled={busyAction !== null} className="w-full inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
          <Share2 className="w-4 h-4" /> Generate Shareable Link
        </button>
        {id && (
          <button type="button" onClick={duplicate} disabled={busyAction !== null} className="w-full inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            <Copy className="w-4 h-4" /> Duplicate
          </button>
        )}
        {shareToken && (
          <Link href={`/quote/${shareToken}`} target="_blank" className="block text-center text-xs text-cyan-700 hover:underline pt-1">
            View public link
          </Link>
        )}
        {id && (
          <div className="text-xs text-slate-400 pt-2 border-t border-slate-100 mt-2">
            Status: <span className="font-semibold text-slate-600">{status}</span>
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
              const reachable = i === 0 || !!id;
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
                    <Field label="Travel Date">
                      <input type="date" className={inputCls} value={draft.travelDate} onChange={(e) => patch({ travelDate: e.target.value })} />
                    </Field>
                    <div />
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
                      <select className={selectCls} value={draft.salesExecutiveId} onChange={(e) => patch({ salesExecutiveId: e.target.value })}>
                        <option value="">Unassigned</option>
                        {salesUsers.map((u) => (
                          <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Lead Source">
                      <select className={selectCls} value={draft.source} onChange={(e) => patch({ source: e.target.value as LeadSource })}>
                        {SOURCES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Quotation Validity">
                      <input type="date" className={inputCls} value={draft.validUntil} onChange={(e) => patch({ validUntil: e.target.value })} />
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

            {step === 2 && <QuotationHotelOptionsEditor options={draft.hotelOptions} onChange={(hotelOptions) => patch({ hotelOptions })} />}

            {step === 3 && <QuotationTransfersEditor transfers={draft.transfers} onChange={(transfers) => patch({ transfers })} />}

            {step === 4 && <QuotationActivitiesEditor activities={draft.activities} onChange={(activities) => patch({ activities })} />}

            {step === 5 && (
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
                disabled={saving || (step === 0 && !canSaveStep1)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {step === 0 ? "Save & Next" : "Next"} <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button type="button" onClick={() => persist()} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50">
                <Save className="w-4 h-4" /> Save Quotation
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
    </div>
  );
}
