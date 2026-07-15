"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDown, ChevronUp } from "lucide-react";
import ImageUpload from "@/components/admin/ui/ImageUpload";
import TagInput from "@/components/admin/ui/TagInput";
import { Field, inputCls, textareaCls, selectCls } from "@/components/admin/ui/Field";
import { useToast } from "@/components/admin/ui/Toast";
import { destinationsApi, packagesApi, itinerariesApi, hotelsApi, transfersApi } from "@/lib/adminApi";
import type { AdminDestination, AdminHotel, AdminItinerary, AdminPackage, AdminTransfer, Status, TravelType } from "@/types/admin";
import { toSlug } from "@/utils/slug";
import ItineraryDaysEditor from "@/components/admin/itinerary/ItineraryDaysEditor";
import HotelStaysEditor from "@/components/admin/hotel/HotelStaysEditor";
import TransferStopsEditor from "@/components/admin/transfer/TransferStopsEditor";
import ActivityListEditor from "@/components/admin/activity/ActivityListEditor";

interface CampaignFormProps {
  id?: string;
}

const TRAVEL_TYPES: TravelType[] = ["Family", "Honeymoon", "Adventure", "Group", "Solo"];

const emptyForm = (): Partial<AdminPackage> => ({
  name: "",
  destinationId: "",
  packageType: "Standard",
  days: 5,
  nights: 4,
  startingPrice: 0,
  offerPrice: 0,
  thumbnail: "",
  coverBanner: "",
  shortDescription: "",
  highlights: [],
  inclusions: [],
  exclusions: [],
  bestTimeToVisit: "",
  travelTypes: [],
  isFeatured: false,
  isRecentlyViewed: false,
  isHeroCampaign: false,
  viewDetailsRedirect: "",
  slug: "",
  seoTitle: "",
  seoDescription: "",
  status: "Active",
  gallery: [],
  bookedByName: "",
  bookedByCity: "",
  bookedByAgo: "",
  activities: [],
  inclusionsText: "",
  exclusionsText: "",
  packageCost: 0,
  platformFee: 0,
  gstPercent: 5,
  marginPrice: 0,
  insurancePrice: 0,
});

export default function CampaignForm({ id }: CampaignFormProps) {
  const router = useRouter();
  const { notify } = useToast();
  const [form, setForm] = useState<Partial<AdminPackage>>(emptyForm());
  const [destinations, setDestinations] = useState<AdminDestination[]>([]);
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);

  const [itineraryOpen, setItineraryOpen] = useState(true);
  const [itinerary, setItinerary] = useState<Partial<AdminItinerary> | null>(null);
  const [itinerarySaving, setItinerarySaving] = useState(false);

  const [hotelOpen, setHotelOpen] = useState(true);
  const [hotelPlan, setHotelPlan] = useState<Partial<AdminHotel> | null>(null);
  const [hotelSaving, setHotelSaving] = useState(false);

  const [transferOpen, setTransferOpen] = useState(true);
  const [transferPlan, setTransferPlan] = useState<Partial<AdminTransfer> | null>(null);
  const [transferSaving, setTransferSaving] = useState(false);

  const [activitiesOpen, setActivitiesOpen] = useState(true);

  useEffect(() => {
    (async () => {
      const dest = await destinationsApi.all();
      if (dest.success) setDestinations(dest.data);

      if (id) {
        const res = await packagesApi.get(id);
        if (res.success && res.data) {
          setForm(res.data);
        } else {
          notify(res.message || "Unable to load campaign", "error");
        }

        const itList = await itinerariesApi.list({ filter: { packageId: id }, pageSize: 1 });
        const existing = itList.success ? itList.data.items[0] : undefined;
        setItinerary(existing ?? { packageId: id, title: "", overview: "", days: [], status: "Active", isPublished: false });

        const hotelList = await hotelsApi.list({ filter: { packageId: id }, pageSize: 1 });
        const existingHotels = hotelList.success ? hotelList.data.items[0] : undefined;
        setHotelPlan(existingHotels ?? { packageId: id, hotels: [], status: "Active" });

        const transferList = await transfersApi.list({ filter: { packageId: id }, pageSize: 1 });
        const existingTransfers = transferList.success ? transferList.data.items[0] : undefined;
        setTransferPlan(existingTransfers ?? { packageId: id, transfers: [], status: "Active" });

        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onChange = (next: Partial<AdminPackage>) => setForm((f) => ({ ...f, ...next }));

  const toggleTravelType = (t: TravelType) => {
    const cur = form.travelTypes ?? [];
    onChange({ travelTypes: cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t] });
  };

  const canSave = !!form.name && !!form.destinationId;

  const priceSubtotal =
    (form.packageCost ?? 0) + (form.platformFee ?? 0) + (form.marginPrice ?? 0) + (form.insurancePrice ?? 0);
  const priceGst = Math.round((priceSubtotal * (form.gstPercent ?? 0)) / 100);
  const priceGrandTotal = priceSubtotal + priceGst;

  const save = async () => {
    if (!form.name || !form.destinationId) return notify("Name and destination are required", "error");
    const payload: Partial<AdminPackage> = {
      ...form,
      slug: form.slug?.trim() || toSlug(form.name),
      viewDetailsRedirect: form.viewDetailsRedirect?.trim() || `/campaigns/${form.slug || toSlug(form.name)}`,
    };

    setSaving(true);
    try {
      if (id) {
        const res = await packagesApi.update(id, payload);
        if (!res.success) return notify(res.message || "Unable to update campaign", "error");
        notify("Campaign updated", "success");
      } else {
        const res = await packagesApi.create(payload as Omit<AdminPackage, "id">);
        if (!res.success) return notify(res.message || "Unable to create campaign", "error");
        notify("Campaign created", "success");
      }
      router.push("/admin/packages-master");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Unexpected error", "error");
    } finally {
      setSaving(false);
    }
  };

  const saveItinerary = async () => {
    if (!id || !itinerary) return;
    setItinerarySaving(true);
    try {
      const payload = { ...itinerary, packageId: id, totalDays: itinerary.days?.length ?? 0 };
      if (itinerary.id) {
        const res = await itinerariesApi.update(itinerary.id, payload);
        if (!res.success || !res.data) return notify(res.message || "Unable to update itinerary", "error");
        setItinerary(res.data);
        notify("Itinerary updated", "success");
      } else {
        const res = await itinerariesApi.create(payload as Omit<AdminItinerary, "id">);
        if (!res.success) return notify(res.message || "Unable to create itinerary", "error");
        setItinerary(res.data);
        notify("Itinerary created", "success");
      }
    } catch (error) {
      notify(error instanceof Error ? error.message : "Unexpected error", "error");
    } finally {
      setItinerarySaving(false);
    }
  };

  const saveHotelPlan = async () => {
    if (!id || !hotelPlan) return;
    setHotelSaving(true);
    try {
      const payload = { ...hotelPlan, packageId: id };
      if (hotelPlan.id) {
        const res = await hotelsApi.update(hotelPlan.id, payload);
        if (!res.success || !res.data) return notify(res.message || "Unable to update hotels", "error");
        setHotelPlan(res.data);
        notify("Hotels updated", "success");
      } else {
        const res = await hotelsApi.create(payload as Omit<AdminHotel, "id">);
        if (!res.success) return notify(res.message || "Unable to create hotels", "error");
        setHotelPlan(res.data);
        notify("Hotels created", "success");
      }
    } catch (error) {
      notify(error instanceof Error ? error.message : "Unexpected error", "error");
    } finally {
      setHotelSaving(false);
    }
  };

  const saveTransferPlan = async () => {
    if (!id || !transferPlan) return;
    setTransferSaving(true);
    try {
      const payload = { ...transferPlan, packageId: id };
      if (transferPlan.id) {
        const res = await transfersApi.update(transferPlan.id, payload);
        if (!res.success || !res.data) return notify(res.message || "Unable to update transfers", "error");
        setTransferPlan(res.data);
        notify("Transfers updated", "success");
      } else {
        const res = await transfersApi.create(payload as Omit<AdminTransfer, "id">);
        if (!res.success) return notify(res.message || "Unable to create transfers", "error");
        setTransferPlan(res.data);
        notify("Transfers created", "success");
      }
    } catch (error) {
      notify(error instanceof Error ? error.message : "Unexpected error", "error");
    } finally {
      setTransferSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center text-sm text-slate-500">
        Loading…
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
        <h2 className="text-xl font-bold text-slate-900">{id ? "Edit Campaign" : "New Campaign"}</h2>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/packages-master"
            className="px-4 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={save}
            disabled={!canSave || saving}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm ${
              !canSave || saving ? "opacity-50 cursor-not-allowed hover:bg-blue-600" : ""
            }`}
          >
            {id ? "Update" : "Save Campaign"}
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Package Name" required>
            <input className={inputCls} value={form.name ?? ""} onChange={(e) => onChange({ name: e.target.value })} />
          </Field>
          <Field label="Destination" required>
            <select className={selectCls} value={form.destinationId ?? ""} onChange={(e) => onChange({ destinationId: e.target.value })}>
              <option value="">Select destination</option>
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Package Type">
            <input className={inputCls} value={form.packageType ?? ""} onChange={(e) => onChange({ packageType: e.target.value })} placeholder="Standard / Premium / Luxury" />
          </Field>
          <Field label="Slug">
            <input className={inputCls} value={form.slug ?? ""} onChange={(e) => onChange({ slug: e.target.value })} />
          </Field>
          <Field label="Days">
            <input type="number" className={inputCls} value={form.days ?? 0} onChange={(e) => onChange({ days: Number(e.target.value) })} />
          </Field>
          <Field label="Nights">
            <input type="number" className={inputCls} value={form.nights ?? 0} onChange={(e) => onChange({ nights: Number(e.target.value) })} />
          </Field>
          <Field label="Starting Price (INR)">
            <input type="number" className={inputCls} value={form.startingPrice ?? 0} onChange={(e) => onChange({ startingPrice: Number(e.target.value) })} />
          </Field>
          <Field label="Offer Price (INR)">
            <input type="number" className={inputCls} value={form.offerPrice ?? 0} onChange={(e) => onChange({ offerPrice: Number(e.target.value) })} />
          </Field>
          <Field label="Best Time to Visit">
            <input className={inputCls} value={form.bestTimeToVisit ?? ""} onChange={(e) => onChange({ bestTimeToVisit: e.target.value })} />
          </Field>
          <Field label="View Details Redirect" hint="Defaults to /campaigns/{slug}">
            <input className={inputCls} value={form.viewDetailsRedirect ?? ""} onChange={(e) => onChange({ viewDetailsRedirect: e.target.value })} />
          </Field>
        </div>

        <Field label="Short Description">
          <textarea className={textareaCls} value={form.shortDescription ?? ""} onChange={(e) => onChange({ shortDescription: e.target.value })} />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Thumbnail Image">
            <ImageUpload value={form.thumbnail} onChange={(url) => onChange({ thumbnail: url })} aspect="4/3" />
          </Field>
          <Field label="Cover Banner">
            <ImageUpload value={form.coverBanner} onChange={(url) => onChange({ coverBanner: url })} aspect="16/9" />
          </Field>
        </div>

        <Field label="Travel Types">
          <div className="flex flex-wrap gap-2">
            {TRAVEL_TYPES.map((t) => {
              const active = form.travelTypes?.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTravelType(t)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                    active ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:border-blue-400"
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Highlights">
            <TagInput value={form.highlights ?? []} onChange={(v) => onChange({ highlights: v })} placeholder="Sunset cruise" />
          </Field>
          <Field label="Inclusions">
            <TagInput value={form.inclusions ?? []} onChange={(v) => onChange({ inclusions: v })} placeholder="All meals" />
          </Field>
          <Field label="Exclusions">
            <TagInput value={form.exclusions ?? []} onChange={(v) => onChange({ exclusions: v })} placeholder="Visa fees" />
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={!!form.isFeatured} onChange={(e) => onChange({ isFeatured: e.target.checked })} className="w-4 h-4 rounded" />
            Featured Package
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={!!form.isRecentlyViewed} onChange={(e) => onChange({ isRecentlyViewed: e.target.checked })} className="w-4 h-4 rounded" />
            Show in Recently Viewed
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={!!form.isHeroCampaign} onChange={(e) => onChange({ isHeroCampaign: e.target.checked })} className="w-4 h-4 rounded" />
            Show in Hero Campaigns
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Booked By Name" hint="Shown in the Recently Booked rail">
            <input className={inputCls} value={form.bookedByName ?? ""} onChange={(e) => onChange({ bookedByName: e.target.value })} placeholder="Aditi" />
          </Field>
          <Field label="Booked By City">
            <input className={inputCls} value={form.bookedByCity ?? ""} onChange={(e) => onChange({ bookedByCity: e.target.value })} placeholder="Mumbai" />
          </Field>
          <Field label="Booked Ago">
            <input className={inputCls} value={form.bookedByAgo ?? ""} onChange={(e) => onChange({ bookedByAgo: e.target.value })} placeholder="12m ago" />
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="SEO Title">
            <input className={inputCls} value={form.seoTitle ?? ""} onChange={(e) => onChange({ seoTitle: e.target.value })} />
          </Field>
          <Field label="SEO Description">
            <input className={inputCls} value={form.seoDescription ?? ""} onChange={(e) => onChange({ seoDescription: e.target.value })} />
          </Field>
        </div>

        <Field label="Status">
          <select className={selectCls} value={form.status ?? "Active"} onChange={(e) => onChange({ status: e.target.value as Status })}>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </Field>

        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <button
            type="button"
            onClick={() => setItineraryOpen((o) => !o)}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            <span className="text-sm font-semibold text-slate-900">Itinerary</span>
            {itineraryOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>
          {itineraryOpen && (
            <div className="p-4 space-y-4">
              {!id ? (
                <p className="text-sm text-slate-500">Save the campaign first to add a day-by-day itinerary.</p>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-slate-500">
                      Day-by-day plan for this campaign.{" "}
                      <Link href="/admin/itineraries" className="text-blue-600 hover:underline">
                        Manage inclusions, terms, FAQs & gallery →
                      </Link>
                    </p>
                    <button
                      type="button"
                      onClick={saveItinerary}
                      disabled={itinerarySaving}
                      className={`shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors ${
                        itinerarySaving ? "opacity-50 cursor-not-allowed hover:bg-blue-600" : ""
                      }`}
                    >
                      {itinerary?.id ? "Update Itinerary" : "Save Itinerary"}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Itinerary Title">
                      <input
                        className={inputCls}
                        value={itinerary?.title ?? ""}
                        onChange={(e) => setItinerary((it) => ({ ...it, title: e.target.value }))}
                      />
                    </Field>
                    <Field label="Overview">
                      <input
                        className={inputCls}
                        value={itinerary?.overview ?? ""}
                        onChange={(e) => setItinerary((it) => ({ ...it, overview: e.target.value }))}
                      />
                    </Field>
                  </div>
                  <ItineraryDaysEditor
                    days={itinerary?.days ?? []}
                    onChange={(days) => setItinerary((it) => ({ ...it, days }))}
                    compact
                  />
                </>
              )}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <button
            type="button"
            onClick={() => setHotelOpen((o) => !o)}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            <span className="text-sm font-semibold text-slate-900">Hotel</span>
            {hotelOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>
          {hotelOpen && (
            <div className="p-4 space-y-4">
              {!id ? (
                <p className="text-sm text-slate-500">Save the campaign first to add hotels.</p>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-slate-500">
                      Hotel stays for this campaign.{" "}
                      <Link href="/admin/hotels" className="text-blue-600 hover:underline">
                        Manage all hotel plans →
                      </Link>
                    </p>
                    <button
                      type="button"
                      onClick={saveHotelPlan}
                      disabled={hotelSaving}
                      className={`shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors ${
                        hotelSaving ? "opacity-50 cursor-not-allowed hover:bg-blue-600" : ""
                      }`}
                    >
                      {hotelPlan?.id ? "Update Hotel" : "Save Hotel"}
                    </button>
                  </div>
                  <HotelStaysEditor
                    hotels={hotelPlan?.hotels ?? []}
                    onChange={(hotels) => setHotelPlan((h) => ({ ...h, hotels }))}
                  />
                </>
              )}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <button
            type="button"
            onClick={() => setTransferOpen((o) => !o)}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            <span className="text-sm font-semibold text-slate-900">Transfer</span>
            {transferOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>
          {transferOpen && (
            <div className="p-4 space-y-4">
              {!id ? (
                <p className="text-sm text-slate-500">Save the campaign first to add transfers.</p>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-slate-500">
                      Transfer legs for this campaign.{" "}
                      <Link href="/admin/transfers" className="text-blue-600 hover:underline">
                        Manage all transfer plans →
                      </Link>
                    </p>
                    <button
                      type="button"
                      onClick={saveTransferPlan}
                      disabled={transferSaving}
                      className={`shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors ${
                        transferSaving ? "opacity-50 cursor-not-allowed hover:bg-blue-600" : ""
                      }`}
                    >
                      {transferPlan?.id ? "Update Transfer" : "Save Transfer"}
                    </button>
                  </div>
                  <TransferStopsEditor
                    transfers={transferPlan?.transfers ?? []}
                    onChange={(transfers) => setTransferPlan((t) => ({ ...t, transfers }))}
                  />
                </>
              )}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <button
            type="button"
            onClick={() => setActivitiesOpen((o) => !o)}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            <span className="text-sm font-semibold text-slate-900">Activities</span>
            {activitiesOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>
          {activitiesOpen && (
            <div className="p-4">
              <ActivityListEditor
                activities={form.activities ?? []}
                onChange={(activities) => onChange({ activities })}
              />
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
            <span className="text-sm font-semibold text-slate-900">Inclusions & Exclusions</span>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Inclusions">
              <textarea
                className={`${textareaCls} min-h-[120px]`}
                value={form.inclusionsText ?? ""}
                onChange={(e) => onChange({ inclusionsText: e.target.value })}
                placeholder="Accommodation, daily breakfast, airport transfers…"
              />
            </Field>
            <Field label="Exclusions">
              <textarea
                className={`${textareaCls} min-h-[120px]`}
                value={form.exclusionsText ?? ""}
                onChange={(e) => onChange({ exclusionsText: e.target.value })}
                placeholder="Airfare, visa fees, personal expenses…"
              />
            </Field>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
            <span className="text-sm font-semibold text-slate-900">Price Details</span>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Package Cost (INR)">
                <input type="number" className={inputCls} value={form.packageCost ?? 0} onChange={(e) => onChange({ packageCost: Number(e.target.value) })} />
              </Field>
              <Field label="Planning Platform Fee (INR)">
                <input type="number" className={inputCls} value={form.platformFee ?? 0} onChange={(e) => onChange({ platformFee: Number(e.target.value) })} />
              </Field>
              <Field label="GST (%)">
                <input type="number" step={0.5} className={inputCls} value={form.gstPercent ?? 0} onChange={(e) => onChange({ gstPercent: Number(e.target.value) })} />
              </Field>
              <Field label="Margin Price (INR)">
                <input type="number" className={inputCls} value={form.marginPrice ?? 0} onChange={(e) => onChange({ marginPrice: Number(e.target.value) })} />
              </Field>
              <Field label="Insurance (INR)">
                <input type="number" className={inputCls} value={form.insurancePrice ?? 0} onChange={(e) => onChange({ insurancePrice: Number(e.target.value) })} />
              </Field>
            </div>
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900">Grand Total</span>
              <span className="text-lg font-bold text-slate-900">INR {priceGrandTotal.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
