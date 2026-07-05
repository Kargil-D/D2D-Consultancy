"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, ArrowRightLeft } from "lucide-react";
import { Field, inputCls, selectCls } from "@/components/admin/ui/Field";
import { transferTypesApi } from "@/lib/adminApi";
import type { AdminTransferType, TransferStopDetail } from "@/types/admin";

export const newTransferStop = (): TransferStopDetail => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  from: "",
  to: "",
});

interface TransferStopsEditorProps {
  transfers: TransferStopDetail[];
  onChange: (transfers: TransferStopDetail[]) => void;
}

export default function TransferStopsEditor({ transfers, onChange }: TransferStopsEditorProps) {
  const [transferTypes, setTransferTypes] = useState<AdminTransferType[]>([]);

  useEffect(() => {
    (async () => {
      const res = await transferTypesApi.list({ pageSize: 1000 });
      if (res.success) setTransferTypes(res.data.items.filter((t) => t.status === "Active"));
    })();
  }, []);

  const update = (idx: number, patch: Partial<TransferStopDetail>) => {
    const next = [...transfers];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };
  const add = () => onChange([...transfers, newTransferStop()]);
  const remove = (idx: number) => onChange(transfers.filter((_, i) => i !== idx));

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-xs text-slate-500">Add each transfer leg with its from / to points.</p>
        <button type="button" onClick={add} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold">
          <Plus className="w-3.5 h-3.5" /> Add Transfer
        </button>
      </div>
      {transfers.map((t, i) => (
        <div key={t.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-slate-400" />
              <span className="font-bold text-slate-900">Transfer {i + 1}</span>
            </div>
            <button type="button" onClick={() => remove(i)} className="p-1.5 rounded text-rose-600 hover:bg-rose-50"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Field label="From">
              <input className={inputCls} value={t.from} onChange={(e) => update(i, { from: e.target.value })} placeholder="Airport" />
            </Field>
            <Field label="Transfer Type">
              <select className={selectCls} value={t.transferTypeId ?? ""} onChange={(e) => update(i, { transferTypeId: e.target.value || undefined })}>
                <option value="">Select transfer type</option>
                {transferTypes.map((tt) => (
                  <option key={tt.id} value={tt.id}>{tt.name}</option>
                ))}
              </select>
            </Field>
            <Field label="To">
              <input className={inputCls} value={t.to} onChange={(e) => update(i, { to: e.target.value })} placeholder="Hotel" />
            </Field>
          </div>
        </div>
      ))}
      {transfers.length === 0 && <p className="text-center py-8 text-sm text-slate-500">No transfers yet. Click &quot;Add Transfer&quot; to begin.</p>}
    </div>
  );
}
