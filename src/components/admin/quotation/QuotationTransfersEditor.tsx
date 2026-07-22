"use client";

import Image from "next/image";
import { Plus, Trash2, Copy, ArrowRightLeft, X } from "lucide-react";
import ImageUpload from "@/components/admin/ui/ImageUpload";
import { Field, inputCls, selectCls, textareaCls } from "@/components/admin/ui/Field";
import type { QuotationLineStatus, QuotationTransferItem } from "@/types/admin";

const STATUSES: QuotationLineStatus[] = ["Included", "Optional", "Excluded"];

export const newTransferItem = (): QuotationTransferItem => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  name: "",
  description: "",
  images: [],
  pickupLocation: "",
  dropLocation: "",
  vehicleType: "",
  mode: "Private",
  duration: "",
  pickupTime: "",
  dropTime: "",
  status: "Included",
  notes: "",
});

interface QuotationTransfersEditorProps {
  transfers: QuotationTransferItem[];
  onChange: (transfers: QuotationTransferItem[]) => void;
}

export default function QuotationTransfersEditor({ transfers, onChange }: QuotationTransfersEditorProps) {
  const update = (idx: number, patch: Partial<QuotationTransferItem>) => {
    const next = [...transfers];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };
  const add = () => onChange([...transfers, newTransferItem()]);
  const duplicate = (idx: number) => {
    const copy = { ...transfers[idx], id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` };
    onChange([...transfers.slice(0, idx + 1), copy, ...transfers.slice(idx + 1)]);
  };
  const remove = (idx: number) => onChange(transfers.filter((_, i) => i !== idx));

  const addImage = (idx: number, url: string) => {
    if (!url) return;
    update(idx, { images: [...(transfers[idx].images ?? []), url] });
  };
  const removeImage = (idx: number, imgIdx: number) => {
    update(idx, { images: (transfers[idx].images ?? []).filter((_, j) => j !== imgIdx) });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-xs text-slate-500">e.g. Airport Transfer, Hotel Transfer, Intercity Transfer, Speed Boat Transfer, Private Cab.</p>
        <button type="button" onClick={add} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold">
          <Plus className="w-3.5 h-3.5" /> Add Transfer
        </button>
      </div>
      {transfers.map((t, i) => (
        <div key={t.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-slate-400" />
              <span className="font-bold text-slate-900">{t.name || `Transfer ${i + 1}`}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                  t.status === "Included" ? "bg-emerald-100 text-emerald-700" : t.status === "Optional" ? "bg-amber-100 text-amber-700" : "bg-slate-200 text-slate-600"
                }`}
              >
                {t.status}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => duplicate(i)} className="p-1.5 rounded text-slate-500 hover:bg-slate-200" aria-label="Duplicate transfer"><Copy className="w-3.5 h-3.5" /></button>
              <button type="button" onClick={() => remove(i)} className="p-1.5 rounded text-rose-600 hover:bg-rose-50" aria-label="Delete transfer"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Field label="Transfer Name">
              <input className={inputCls} value={t.name} onChange={(e) => update(i, { name: e.target.value })} placeholder="Airport Transfer" />
            </Field>
            <Field label="Vehicle Type">
              <input className={inputCls} value={t.vehicleType} onChange={(e) => update(i, { vehicleType: e.target.value })} placeholder="Sedan, SUV, Coach…" />
            </Field>
            <Field label="Private / SIC">
              <select className={selectCls} value={t.mode} onChange={(e) => update(i, { mode: e.target.value as "Private" | "SIC" })}>
                <option value="Private">Private</option>
                <option value="SIC">SIC</option>
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <Field label="Pickup Location">
              <input className={inputCls} value={t.pickupLocation} onChange={(e) => update(i, { pickupLocation: e.target.value })} placeholder="Airport" />
            </Field>
            <Field label="Drop Location">
              <input className={inputCls} value={t.dropLocation} onChange={(e) => update(i, { dropLocation: e.target.value })} placeholder="Hotel" />
            </Field>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
            <Field label="Duration">
              <input className={inputCls} value={t.duration} onChange={(e) => update(i, { duration: e.target.value })} placeholder="45 mins" />
            </Field>
            <Field label="Pickup Time">
              <input type="time" className={inputCls} value={t.pickupTime} onChange={(e) => update(i, { pickupTime: e.target.value })} />
            </Field>
            <Field label="Drop Time">
              <input type="time" className={inputCls} value={t.dropTime} onChange={(e) => update(i, { dropTime: e.target.value })} />
            </Field>
            <Field label="Status">
              <select className={selectCls} value={t.status} onChange={(e) => update(i, { status: e.target.value as QuotationLineStatus })}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Description" className="mt-3">
            <textarea className={textareaCls} value={t.description} onChange={(e) => update(i, { description: e.target.value })} />
          </Field>
          <Field label="Notes" className="mt-3">
            <textarea className={textareaCls} value={t.notes} onChange={(e) => update(i, { notes: e.target.value })} />
          </Field>
          <Field label="Images" className="mt-3">
            <div className="grid grid-cols-4 gap-2">
              {(t.images ?? []).map((url, imgIdx) => (
                <div key={imgIdx} className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                  <Image src={url} alt={`${t.name || "transfer"}-${imgIdx}`} fill sizes="120px" className="object-cover" unoptimized />
                  <button type="button" onClick={() => removeImage(i, imgIdx)} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white/90 text-rose-600 flex items-center justify-center shadow" aria-label="Remove image">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <div className="aspect-square">
                <ImageUpload value="" onChange={(url) => addImage(i, url)} label="Add" aspect="square" />
              </div>
            </div>
          </Field>
        </div>
      ))}
      {transfers.length === 0 && <p className="text-center py-8 text-sm text-slate-500">No transfers yet. Click &quot;Add Transfer&quot; to begin.</p>}
    </div>
  );
}
