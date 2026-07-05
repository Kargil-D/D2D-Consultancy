"use client";

import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from "lucide-react";
import ImageUpload from "@/components/admin/ui/ImageUpload";
import TagInput from "@/components/admin/ui/TagInput";
import { Field, inputCls, textareaCls } from "@/components/admin/ui/Field";
import type { ItineraryDayDetail } from "@/types/admin";

export const newDay = (n: number): ItineraryDayDetail => ({
  id: `${Date.now()}-${n}`,
  dayNumber: n,
  title: `Day ${n}`,
  description: "",
  activities: [],
  mealsIncluded: [],
  stayDetails: "",
  transportDetails: "",
  dayImage: "",
  order: n,
});

interface ItineraryDaysEditorProps {
  days: ItineraryDayDetail[];
  onChange: (days: ItineraryDayDetail[]) => void;
  /** When true, hides Day Image, Activities, Meals Included, Stay Details and Transport Details — leaving only Title + Description. */
  compact?: boolean;
}

export default function ItineraryDaysEditor({ days, onChange, compact = false }: ItineraryDaysEditorProps) {
  const update = (idx: number, patch: Partial<ItineraryDayDetail>) => {
    const next = [...days];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };
  const add = () => onChange([...days, newDay(days.length + 1)]);
  const remove = (idx: number) => {
    const next = days.filter((_, i) => i !== idx).map((d, i) => ({ ...d, dayNumber: i + 1, order: i + 1 }));
    onChange(next);
  };
  const move = (idx: number, dir: -1 | 1) => {
    const ni = idx + dir;
    if (ni < 0 || ni >= days.length) return;
    const next = [...days];
    [next[idx], next[ni]] = [next[ni], next[idx]];
    onChange(next.map((d, i) => ({ ...d, dayNumber: i + 1, order: i + 1 })));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-xs text-slate-500">Use arrows to reorder days. Day numbers auto-update.</p>
        <button type="button" onClick={add} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold">
          <Plus className="w-3.5 h-3.5" /> Add Day
        </button>
      </div>
      {days.map((d, i) => (
        <div key={d.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-slate-400" />
              <span className="font-bold text-slate-900">Day {d.dayNumber}</span>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => move(i, -1)} className="p-1.5 rounded text-slate-500 hover:bg-slate-200" disabled={i === 0}><ChevronUp className="w-3.5 h-3.5" /></button>
              <button type="button" onClick={() => move(i, 1)} className="p-1.5 rounded text-slate-500 hover:bg-slate-200" disabled={i === days.length - 1}><ChevronDown className="w-3.5 h-3.5" /></button>
              <button type="button" onClick={() => remove(i)} className="p-1.5 rounded text-rose-600 hover:bg-rose-50"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Day Title" className={compact ? "md:col-span-2" : undefined}>
              <input className={inputCls} value={d.title} onChange={(e) => update(i, { title: e.target.value })} />
            </Field>
            {!compact && (
              <Field label="Day Image">
                <ImageUpload value={d.dayImage} onChange={(url) => update(i, { dayImage: url })} aspect="4/3" />
              </Field>
            )}
          </div>
          <Field label="Description">
            <textarea className={textareaCls} value={d.description} onChange={(e) => update(i, { description: e.target.value })} />
          </Field>
          {!compact && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <Field label="Activities">
                <TagInput value={d.activities} onChange={(v) => update(i, { activities: v })} placeholder="Snorkeling" />
              </Field>
              <Field label="Meals Included">
                <TagInput value={d.mealsIncluded} onChange={(v) => update(i, { mealsIncluded: v })} placeholder="Breakfast, Dinner" />
              </Field>
              <Field label="Stay Details">
                <input className={inputCls} value={d.stayDetails} onChange={(e) => update(i, { stayDetails: e.target.value })} />
              </Field>
              <Field label="Transport Details">
                <input className={inputCls} value={d.transportDetails} onChange={(e) => update(i, { transportDetails: e.target.value })} />
              </Field>
            </div>
          )}
        </div>
      ))}
      {days.length === 0 && <p className="text-center py-8 text-sm text-slate-500">No days yet. Click &quot;Add Day&quot; to begin.</p>}
    </div>
  );
}
