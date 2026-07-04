"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ImageUpload from "@/components/admin/ui/ImageUpload";
import { Field, inputCls, textareaCls, selectCls } from "@/components/admin/ui/Field";
import { useToast } from "@/components/admin/ui/Toast";
import { destinationsApi } from "@/lib/adminApi";
import type { AdminDestination, Status } from "@/types/admin";
import { toSlug } from "@/utils/slug";

interface DestinationFormProps {
  id?: string;
}

const emptyForm = (): Partial<AdminDestination> => ({
  name: "",
  country: "",
  state: "",
  city: "",
  slug: "",
  shortDescription: "",
  fullDescription: "",
  thumbnailImage: "",
  bannerImage: "",
  isPopular: false,
  displayOrder: 0,
  seoTitle: "",
  seoDescription: "",
  status: "Active",
  isDomestic: false,
});

export default function DestinationForm({ id }: DestinationFormProps) {
  const router = useRouter();
  const { notify } = useToast();
  const [form, setForm] = useState<Partial<AdminDestination>>(emptyForm());
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const res = await destinationsApi.get(id);
      if (res.success && res.data) {
        setForm(res.data);
      } else {
        notify(res.message || "Unable to load destination", "error");
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onChange = (next: Partial<AdminDestination>) =>
    setForm((f) => ({ ...f, ...next }));

  const canSave = !!form.name && !!form.country;

  const save = async () => {
    if (!form.name || !form.country) return notify("Name and country are required", "error");
    const payload: Partial<AdminDestination> = {
      ...form,
      slug: form.slug?.trim() || toSlug(form.name),
      shortDescription: form.shortDescription ?? "",
      fullDescription: form.fullDescription ?? "",
      status: form.status ?? "Active",
      displayOrder: form.displayOrder ?? 0,
      isDomestic: form.isDomestic ?? false,
    };

    setSaving(true);
    try {
      if (id) {
        const res = await destinationsApi.update(id, payload);
        if (!res.success) return notify(res.message || "Unable to update destination", "error");
        notify("Destination updated", "success");
      } else {
        const res = await destinationsApi.create(payload as Omit<AdminDestination, "id">);
        if (!res.success) return notify(res.message || "Unable to create destination", "error");
        notify("Destination created", "success");
      }
      router.push("/admin/destinations");
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
        <h2 className="text-xl font-bold text-slate-900">{id ? "Edit Destination" : "New Destination"}</h2>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/destinations"
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
            {id ? "Update" : "Save Destination"}
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Destination Name" required>
            <input className={inputCls} value={form.name ?? ""} onChange={(e) => onChange({ name: e.target.value })} placeholder="Bali" />
            {!form.name && <div className="text-rose-600 text-sm mt-1">Name is required</div>}
          </Field>
          <Field label="Slug URL" hint="Auto-generated from name if blank">
            <input className={inputCls} value={form.slug ?? ""} onChange={(e) => onChange({ slug: e.target.value })} placeholder="bali" />
          </Field>
          <Field label="Country" required>
            <input className={inputCls} value={form.country ?? ""} onChange={(e) => onChange({ country: e.target.value })} placeholder="Indonesia" />
            {!form.country && <div className="text-rose-600 text-sm mt-1">Country is required</div>}
          </Field>
          <Field label="Destination Type" hint="This determines whether the menu item appears under Domestic or International">
            <select
              className={selectCls}
              value={form.isDomestic ? "Domestic" : "International"}
              onChange={(e) => onChange({ isDomestic: e.target.value === "Domestic" })}
            >
              <option value="Domestic">Domestic</option>
              <option value="International">International</option>
            </select>
          </Field>
          <Field label="State / Region">
            <input className={inputCls} value={form.state ?? ""} onChange={(e) => onChange({ state: e.target.value })} />
          </Field>
          <Field label="City">
            <input className={inputCls} value={form.city ?? ""} onChange={(e) => onChange({ city: e.target.value })} />
          </Field>
          <Field label="Display Order">
            <input type="number" className={inputCls} value={form.displayOrder ?? 0} onChange={(e) => onChange({ displayOrder: Number(e.target.value) })} />
          </Field>
        </div>

        <Field label="Short Description">
          <input className={inputCls} value={form.shortDescription ?? ""} onChange={(e) => onChange({ shortDescription: e.target.value })} placeholder="Island of paradise" />
        </Field>
        <Field label="Full Description">
          <textarea className={textareaCls} value={form.fullDescription ?? ""} onChange={(e) => onChange({ fullDescription: e.target.value })} />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Thumbnail Image">
            <ImageUpload value={form.thumbnailImage} onChange={(url) => onChange({ thumbnailImage: url })} aspect="4/3" />
          </Field>
          <Field label="Banner Image">
            <ImageUpload value={form.bannerImage} onChange={(url) => onChange({ bannerImage: url })} aspect="16/9" />
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

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={!!form.isPopular}
              onChange={(e) => onChange({ isPopular: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            Mark as popular destination
          </label>
          <Field label="Status" className="!mb-0">
            <select className={selectCls} value={form.status ?? "Active"} onChange={(e) => onChange({ status: e.target.value as Status })}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </Field>
        </div>
      </div>
    </div>
  );
}
