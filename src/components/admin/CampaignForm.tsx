"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ImageUpload from "@/components/admin/ui/ImageUpload";
import TagInput from "@/components/admin/ui/TagInput";
import { Field, inputCls, textareaCls, selectCls } from "@/components/admin/ui/Field";
import { useToast } from "@/components/admin/ui/Toast";
import { destinationsApi, packagesApi } from "@/lib/adminApi";
import type { AdminDestination, AdminPackage, Status, TravelType } from "@/types/admin";
import { toSlug } from "@/utils/slug";

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
});

export default function CampaignForm({ id }: CampaignFormProps) {
  const router = useRouter();
  const { notify } = useToast();
  const [form, setForm] = useState<Partial<AdminPackage>>(emptyForm());
  const [destinations, setDestinations] = useState<AdminDestination[]>([]);
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);

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

  const save = async () => {
    if (!form.name || !form.destinationId) return notify("Name and destination are required", "error");
    const payload: Partial<AdminPackage> = {
      ...form,
      slug: form.slug?.trim() || toSlug(form.name),
      viewDetailsRedirect: form.viewDetailsRedirect?.trim() || `/packages/${form.slug || toSlug(form.name)}`,
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
          <Field label="Starting Price (₹)">
            <input type="number" className={inputCls} value={form.startingPrice ?? 0} onChange={(e) => onChange({ startingPrice: Number(e.target.value) })} />
          </Field>
          <Field label="Offer Price (₹)">
            <input type="number" className={inputCls} value={form.offerPrice ?? 0} onChange={(e) => onChange({ offerPrice: Number(e.target.value) })} />
          </Field>
          <Field label="Best Time to Visit">
            <input className={inputCls} value={form.bestTimeToVisit ?? ""} onChange={(e) => onChange({ bestTimeToVisit: e.target.value })} />
          </Field>
          <Field label="View Details Redirect" hint="Defaults to /packages/{slug}">
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
      </div>
    </div>
  );
}
