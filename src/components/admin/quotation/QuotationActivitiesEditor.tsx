"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Plus, Trash2, Copy, Ticket } from "lucide-react";
import { Field, inputCls, selectCls, textareaCls } from "@/components/admin/ui/Field";
import { isWithinRange, dateRangeMessage } from "@/utils/dateRange";
import { useToast } from "@/components/admin/ui/Toast";
import { activitiesApi } from "@/lib/adminApi";
import type { AdminActivity, QuotationActivityItem } from "@/types/admin";

export const newActivityItem = (): QuotationActivityItem => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  activityMasterId: null,
  name: "",
  description: "",
  images: [],
  activityDate: "",
  duration: "",
  reportingTime: "",
  activityTime: "",
  pax: 1,
  notes: "",
});

type CatalogState = "idle" | "loading" | "loaded" | "error";

interface QuotationActivitiesEditorProps {
  activities: QuotationActivityItem[];
  onChange: (activities: QuotationActivityItem[]) => void;
  /** Quotation's selected destination — the activity dropdown is scoped to Activity Master rows for this destination. */
  destinationId?: string;
  /** Trip's travel start/end dates (YYYY-MM-DD) — each activity date must fall within this range. */
  minDate?: string;
  maxDate?: string;
}

export default function QuotationActivitiesEditor({ activities, onChange, destinationId, minDate, maxDate }: QuotationActivitiesEditorProps) {
  const { notify } = useToast();
  const [catalog, setCatalog] = useState<AdminActivity[]>([]);
  const [catalogState, setCatalogState] = useState<CatalogState>("idle");

  useEffect(() => {
    if (!destinationId) {
      setCatalog([]);
      setCatalogState("idle");
      return;
    }

    let cancelled = false;
    setCatalogState("loading");

    activitiesApi
      .list({ pageSize: 1000, filter: { destinationId, status: "Active" } })
      .then((res) => {
        if (cancelled) return;
        if (!res.success) {
          setCatalogState("error");
          return;
        }
        setCatalog(res.data.items);
        setCatalogState("loaded");
      })
      .catch(() => {
        if (!cancelled) setCatalogState("error");
      });

    return () => {
      cancelled = true;
    };
  }, [destinationId]);

  const update = (idx: number, patch: Partial<QuotationActivityItem>) => {
    const next = [...activities];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };

  /** Selecting an activity from Activity Master loads its name/description/images; they stay read-only. */
  const selectActivity = (idx: number, activityMasterId: string) => {
    if (!activityMasterId) {
      update(idx, { activityMasterId: null, name: "", description: "", images: [] });
      return;
    }
    const master = catalog.find((a) => a.id === activityMasterId);
    if (!master) return;
    update(idx, {
      activityMasterId: master.id,
      name: master.name,
      description: master.description,
      images: master.imageUrl ? [master.imageUrl] : [],
    });
  };

  /** Rejects an activity date outside the trip's travel dates instead of applying it. */
  const updateDate = (idx: number, value: string) => {
    if (!isWithinRange(value, minDate, maxDate)) {
      notify(dateRangeMessage(minDate, maxDate), "error");
      return;
    }
    update(idx, { activityDate: value });
  };
  const add = () => onChange([...activities, newActivityItem()]);
  const duplicate = (idx: number) => {
    const copy = { ...activities[idx], id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` };
    onChange([...activities.slice(0, idx + 1), copy, ...activities.slice(idx + 1)]);
  };
  const remove = (idx: number) => onChange(activities.filter((_, i) => i !== idx));

  const dropdownDisabled = !destinationId || catalogState === "loading" || catalogState === "error";
  const dropdownPlaceholder = !destinationId
    ? "Select a destination first"
    : catalogState === "loading"
      ? "Loading activities…"
      : catalogState === "error"
        ? "Unable to load activities"
        : catalog.length === 0
          ? "No activities available for this destination"
          : "Select an activity";

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-xs text-slate-500">Activities are loaded from Activity Master for the quotation&apos;s destination.</p>
        <button type="button" onClick={add} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold">
          <Plus className="w-3.5 h-3.5" /> Add Activity
        </button>
      </div>
      {activities.map((a, i) => {
        const selectedNotInCatalog = !!a.activityMasterId && !catalog.some((c) => c.id === a.activityMasterId);
        return (
          <div key={a.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4 text-slate-400" />
                <span className="font-bold text-slate-900">{a.name || `Activity ${i + 1}`}</span>
              </div>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => duplicate(i)} className="p-1.5 rounded text-slate-500 hover:bg-slate-200" aria-label="Duplicate activity"><Copy className="w-3.5 h-3.5" /></button>
                <button type="button" onClick={() => remove(i)} className="p-1.5 rounded text-rose-600 hover:bg-rose-50" aria-label="Delete activity"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Activity Name">
                <select
                  className={selectCls}
                  value={a.activityMasterId ?? ""}
                  disabled={dropdownDisabled}
                  onChange={(e) => selectActivity(i, e.target.value)}
                >
                  <option value="">{dropdownPlaceholder}</option>
                  {selectedNotInCatalog && (
                    <option value={a.activityMasterId ?? ""}>{a.name || "Selected activity"} (unavailable)</option>
                  )}
                  {catalog.map((activity) => (
                    <option key={activity.id} value={activity.id}>{activity.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Activity Date">
                <input type="date" className={inputCls} value={a.activityDate} min={minDate} max={maxDate} onChange={(e) => updateDate(i, e.target.value)} />
              </Field>
            </div>

            <Field label="Description" className="mt-3">
              <textarea
                className={`${textareaCls} disabled:cursor-not-allowed`}
                value={a.description}
                disabled
                readOnly
                placeholder="Select an activity to load its description from Activity Master."
              />
            </Field>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
              <Field label="Duration">
                <input className={inputCls} value={a.duration} onChange={(e) => update(i, { duration: e.target.value })} placeholder="4 hours" />
              </Field>
              <Field label="Reporting Time">
                <input type="time" className={inputCls} value={a.reportingTime} onChange={(e) => update(i, { reportingTime: e.target.value })} />
              </Field>
              <Field label="Activity Time">
                <input type="time" className={inputCls} value={a.activityTime} onChange={(e) => update(i, { activityTime: e.target.value })} />
              </Field>
              <Field label="No. of Pax">
                <input type="number" min={0} className={inputCls} value={a.pax} onChange={(e) => update(i, { pax: Number(e.target.value) || 0 })} />
              </Field>
            </div>

            <Field label="Images" className="mt-3">
              {a.images.length > 0 ? (
                <div className="grid grid-cols-4 gap-2">
                  {a.images.map((url, imgIdx) => (
                    <div key={imgIdx} className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                      <Image src={url} alt={`${a.name || "activity"}-${imgIdx}`} fill sizes="120px" className="object-cover" unoptimized />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No images yet — select an activity above to load its images from Activity Master.</p>
              )}
            </Field>
          </div>
        );
      })}
      {activities.length === 0 && <p className="text-center py-8 text-sm text-slate-500">No activities yet. Click &quot;Add Activity&quot; to begin.</p>}
    </div>
  );
}
