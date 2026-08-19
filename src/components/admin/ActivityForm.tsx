"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ImageUpload from "@/components/admin/ui/ImageUpload";
import CityMultiSelect from "@/components/admin/ui/CityMultiSelect";
import DestinationSearchSelect from "@/components/admin/ui/DestinationSearchSelect";
import { Field, inputCls, textareaCls } from "@/components/admin/ui/Field";
import StatusToggle from "@/components/admin/ui/StatusToggle";
import { useToast } from "@/components/admin/ui/Toast";
import LoadingOverlay from "@/components/admin/ui/LoadingOverlay";
import { activitiesApi, destinationsApi } from "@/lib/adminApi";
import type { AdminActivity, AdminDestination } from "@/types/admin";

interface ActivityFormProps {
  id?: string;
}

const emptyForm = (): Partial<AdminActivity> => ({
  name: "",
  destinationId: "",
  cities: [],
  description: "",
  imageUrl: "",
  displayOrder: 0,
  status: "Active",
});

export default function ActivityForm({ id }: ActivityFormProps) {
  const router = useRouter();
  const { notify } = useToast();
  const [form, setForm] = useState<Partial<AdminActivity>>(emptyForm());
  const [destinations, setDestinations] = useState<AdminDestination[]>([]);
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    destinationsApi.all().then((res) => {
      if (res.success) setDestinations(res.data);
    });
  }, []);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const res = await activitiesApi.get(id);
      if (res.success && res.data) {
        setForm(res.data);
      } else {
        notify(res.message || "Unable to load activity", "error");
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onChange = (next: Partial<AdminActivity>) => setForm((f) => ({ ...f, ...next }));

  const selectedDestination = destinations.find((d) => d.id === form.destinationId) ?? form.destination ?? null;
  const cityOptions = selectedDestination?.cities ?? [];

  const onDestinationChange = (destinationId: string) => {
    const dest = destinations.find((d) => d.id === destinationId) ?? null;
    const validCityIds = new Set((dest?.cities ?? []).map((c) => c.id));
    setForm((f) => ({
      ...f,
      destinationId,
      destination: dest,
      cities: (f.cities ?? []).filter((c) => validCityIds.has(c.id)),
    }));
  };

  const nameError = !form.name?.trim();
  const destinationError = !form.destinationId;
  const cityError = (form.cities?.length ?? 0) === 0;
  const descriptionError = !form.description?.trim();
  const canSave = !nameError && !destinationError && !cityError && !descriptionError;

  const save = async () => {
    if (saving) return;
    if (!canSave) return notify("Please fill in all required fields", "error");

    const { cities, destination: _destination, ...rest } = form;
    void _destination;
    const payload: Partial<AdminActivity> = {
      ...rest,
      name: form.name!.trim(),
      description: form.description!.trim(),
      displayOrder: form.displayOrder ?? 0,
      status: form.status ?? "Active",
      cityIds: (cities ?? []).map((c) => c.id),
    };

    setSaving(true);
    try {
      if (id) {
        const res = await activitiesApi.update(id, payload);
        if (!res.success) return notify(res.message || "Unable to update activity", "error");
        notify("Activity updated", "success");
      } else {
        const res = await activitiesApi.create(payload as Omit<AdminActivity, "id">);
        if (!res.success) return notify(res.message || "Unable to create activity", "error");
        notify("Activity created", "success");
      }
      router.push("/admin/activities");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Unexpected error", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center text-sm text-slate-500">
        <span className="inline-block w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2 align-middle" />
        Loading…
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
      <LoadingOverlay show={saving} label={id ? "Updating activity…" : "Saving activity…"} />
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
        <h2 className="text-xl font-bold text-slate-900">{id ? "Edit Activity" : "Add Activity"}</h2>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/activities"
            aria-disabled={saving}
            onClick={(e) => saving && e.preventDefault()}
            className={`px-4 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100 ${
              saving ? "opacity-50 cursor-not-allowed pointer-events-none" : ""
            }`}
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
            {saving && (
              <span className="inline-block w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
            )}
            {id ? (saving ? "Updating…" : "Update") : saving ? "Saving…" : "Save Activity"}
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Activity Name" required>
            <input
              className={inputCls}
              value={form.name ?? ""}
              onChange={(e) => onChange({ name: e.target.value })}
              placeholder="Batu Caves & Kuala Lumpur City Tour"
            />
            {nameError && <div className="text-rose-600 text-sm mt-1">Activity name is required</div>}
          </Field>
          <Field label="Destination" required>
            <DestinationSearchSelect destinations={destinations} value={form.destinationId ?? ""} onChange={onDestinationChange} />
            {destinationError && <div className="text-rose-600 text-sm mt-1">Destination is required</div>}
          </Field>
          <Field label="City" required hint={!form.destinationId ? "Select a destination first" : undefined}>
            <CityMultiSelect
              value={form.cities ?? []}
              onChange={(cities) => onChange({ cities })}
              options={cityOptions}
              placeholder="Search or select city..."
              emptyText={form.destinationId ? "No cities mapped to this destination yet" : "Select a destination first"}
            />
            {cityError && <div className="text-rose-600 text-sm mt-1">At least one city is required</div>}
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Description" required className="md:col-span-2">
            <textarea
              className={textareaCls}
              value={form.description ?? ""}
              onChange={(e) => onChange({ description: e.target.value })}
              placeholder="Explore the iconic Batu Caves and experience the highlights of Kuala Lumpur with a local guide."
            />
            {descriptionError && <div className="text-rose-600 text-sm mt-1">Description is required</div>}
          </Field>
          <Field label="Image">
            <ImageUpload value={form.imageUrl ?? ""} onChange={(url) => onChange({ imageUrl: url })} aspect="16/9" />
          </Field>
        </div>

        <Field label="Status" className="!mb-0">
          <StatusToggle value={form.status ?? "Active"} onChange={(status) => onChange({ status })} />
        </Field>
      </div>
    </div>
  );
}
