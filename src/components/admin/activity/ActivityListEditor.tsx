"use client";

import { Plus, Trash2, Sparkles } from "lucide-react";
import { Field, inputCls } from "@/components/admin/ui/Field";
import type { ActivityDetail } from "@/types/admin";

export const newActivity = (): ActivityDetail => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  title: "",
  icon: "",
});

interface ActivityListEditorProps {
  activities: ActivityDetail[];
  onChange: (activities: ActivityDetail[]) => void;
}

export default function ActivityListEditor({ activities, onChange }: ActivityListEditorProps) {
  const update = (idx: number, patch: Partial<ActivityDetail>) => {
    const next = [...activities];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };
  const add = () => onChange([...activities, newActivity()]);
  const remove = (idx: number) => onChange(activities.filter((_, i) => i !== idx));

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-xs text-slate-500">Icons use lucide-react names: Anchor, Waves, Compass, Fish, Heart, Sparkles.</p>
        <button type="button" onClick={add} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold">
          <Plus className="w-3.5 h-3.5" /> Add Activity
        </button>
      </div>
      {activities.map((a, i) => (
        <div key={a.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-slate-400" />
              <span className="font-bold text-slate-900">Activity {i + 1}</span>
            </div>
            <button type="button" onClick={() => remove(i)} className="p-1.5 rounded text-rose-600 hover:bg-rose-50"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Title">
              <input className={inputCls} value={a.title} onChange={(e) => update(i, { title: e.target.value })} placeholder="Dolphin Cruise" />
            </Field>
            <Field label="Icon">
              <input className={inputCls} value={a.icon ?? ""} onChange={(e) => update(i, { icon: e.target.value })} placeholder="Sparkles" />
            </Field>
          </div>
        </div>
      ))}
      {activities.length === 0 && <p className="text-center py-8 text-sm text-slate-500">No activities yet. Click &quot;Add Activity&quot; to begin.</p>}
    </div>
  );
}
