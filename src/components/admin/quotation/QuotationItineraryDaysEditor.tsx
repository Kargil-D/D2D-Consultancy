"use client";

import { Plus, Trash2, Copy, ChevronUp, ChevronDown } from "lucide-react";
import { Field, inputCls, textareaCls } from "@/components/admin/ui/Field";
import type { QuotationItineraryDay } from "@/types/admin";

export const newQuotationDay = (n: number): QuotationItineraryDay => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  dayNumber: n,
  title: `Day ${n}`,
  description: "",
  images: [],
  meals: [],
  notes: "",
});

interface QuotationItineraryDaysEditorProps {
  days: QuotationItineraryDay[];
  onChange: (days: QuotationItineraryDay[]) => void;
}

const renumber = (days: QuotationItineraryDay[]) => days.map((d, i) => ({ ...d, dayNumber: i + 1 }));

export default function QuotationItineraryDaysEditor({ days, onChange }: QuotationItineraryDaysEditorProps) {
  const update = (idx: number, patch: Partial<QuotationItineraryDay>) => {
    const next = [...days];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };
  const add = () => onChange([...days, newQuotationDay(days.length + 1)]);
  const duplicate = (idx: number) => {
    const copy = { ...days[idx], id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` };
    const next = [...days.slice(0, idx + 1), copy, ...days.slice(idx + 1)];
    onChange(renumber(next));
  };
  const remove = (idx: number) => onChange(renumber(days.filter((_, i) => i !== idx)));
  const move = (idx: number, dir: -1 | 1) => {
    const ni = idx + dir;
    if (ni < 0 || ni >= days.length) return;
    const next = [...days];
    [next[idx], next[ni]] = [next[ni], next[idx]];
    onChange(renumber(next));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-xs text-slate-500">Use the arrows to reorder days — day numbers update automatically.</p>
        <button type="button" onClick={add} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold">
          <Plus className="w-3.5 h-3.5" /> Add Day
        </button>
      </div>
      {days.map((d, i) => (
        <div key={d.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="font-bold text-slate-900">Day {d.dayNumber}</span>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="p-1.5 rounded text-slate-500 hover:bg-slate-200 disabled:opacity-30"><ChevronUp className="w-3.5 h-3.5" /></button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === days.length - 1} className="p-1.5 rounded text-slate-500 hover:bg-slate-200 disabled:opacity-30"><ChevronDown className="w-3.5 h-3.5" /></button>
              <button type="button" onClick={() => duplicate(i)} className="p-1.5 rounded text-slate-500 hover:bg-slate-200" aria-label="Duplicate day"><Copy className="w-3.5 h-3.5" /></button>
              <button type="button" onClick={() => remove(i)} className="p-1.5 rounded text-rose-600 hover:bg-rose-50" aria-label="Delete day"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
          <Field label="Day Title">
            <input className={inputCls} value={d.title} onChange={(e) => update(i, { title: e.target.value })} />
          </Field>
          <Field label="Description" className="mt-3">
            <textarea className={textareaCls} value={d.description} onChange={(e) => update(i, { description: e.target.value })} />
          </Field>
          <Field label="Notes" className="mt-3">
            <textarea className={textareaCls} value={d.notes} onChange={(e) => update(i, { notes: e.target.value })} placeholder="Stay/transport details, internal remarks…" />
          </Field>
        </div>
      ))}
      {days.length === 0 && <p className="text-center py-8 text-sm text-slate-500">No days yet. Click &quot;Add Day&quot; to begin.</p>}
    </div>
  );
}
