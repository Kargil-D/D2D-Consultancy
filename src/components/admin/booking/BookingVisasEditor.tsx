"use client";

import { Plus, Trash2, Copy, Stamp } from "lucide-react";
import DocumentUpload from "@/components/admin/booking/DocumentUpload";
import { Field, inputCls, selectCls } from "@/components/admin/ui/Field";
import type { AdminBookingVisa, VisaProcessStatus } from "@/types/admin";

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const STATUSES: VisaProcessStatus[] = ["Applied", "Approved", "Rejected", "Issued"];

export const newBookingVisa = (): AdminBookingVisa => ({
  id: newId(),
  country: "",
  visaType: "",
  visaNumber: "",
  applicationDate: null,
  issueDate: null,
  expiryDate: null,
  status: "Applied",
  supplier: "",
  visaCopyUrl: null,
});

interface Props {
  visas: AdminBookingVisa[];
  onChange: (visas: AdminBookingVisa[]) => void;
}

export default function BookingVisasEditor({ visas, onChange }: Props) {
  const update = (idx: number, patch: Partial<AdminBookingVisa>) => {
    const next = [...visas];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };
  const add = () => onChange([...visas, newBookingVisa()]);
  const duplicate = (idx: number) => {
    const copy = { ...visas[idx], id: newId() };
    onChange([...visas.slice(0, idx + 1), copy, ...visas.slice(idx + 1)]);
  };
  const remove = (idx: number) => onChange(visas.filter((_, i) => i !== idx));

  const badgeCls = (s: VisaProcessStatus) =>
    s === "Issued" || s === "Approved" ? "bg-emerald-100 text-emerald-700" : s === "Rejected" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700";

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-xs text-slate-500">One entry per traveller/country visa.</p>
        <button type="button" onClick={add} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold">
          <Plus className="w-3.5 h-3.5" /> Add Visa
        </button>
      </div>
      {visas.map((v, i) => (
        <div key={v.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Stamp className="w-4 h-4 text-slate-400" />
              <span className="font-bold text-slate-900">{v.country || `Visa ${i + 1}`}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${badgeCls(v.status)}`}>{v.status}</span>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => duplicate(i)} className="p-1.5 rounded text-slate-500 hover:bg-slate-200" aria-label="Duplicate visa"><Copy className="w-3.5 h-3.5" /></button>
              <button type="button" onClick={() => remove(i)} className="p-1.5 rounded text-rose-600 hover:bg-rose-50" aria-label="Delete visa"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Field label="Country"><input className={inputCls} value={v.country} onChange={(e) => update(i, { country: e.target.value })} /></Field>
            <Field label="Visa Type"><input className={inputCls} value={v.visaType} onChange={(e) => update(i, { visaType: e.target.value })} placeholder="Tourist" /></Field>
            <Field label="Visa Number"><input className={inputCls} value={v.visaNumber} onChange={(e) => update(i, { visaNumber: e.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
            <Field label="Application Date"><input type="date" className={inputCls} value={v.applicationDate ?? ""} onChange={(e) => update(i, { applicationDate: e.target.value || null })} /></Field>
            <Field label="Issue Date"><input type="date" className={inputCls} value={v.issueDate ?? ""} onChange={(e) => update(i, { issueDate: e.target.value || null })} /></Field>
            <Field label="Expiry Date"><input type="date" className={inputCls} value={v.expiryDate ?? ""} onChange={(e) => update(i, { expiryDate: e.target.value || null })} /></Field>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <Field label="Status">
              <select className={selectCls} value={v.status} onChange={(e) => update(i, { status: e.target.value as VisaProcessStatus })}>
                {STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
            </Field>
            <Field label="Supplier"><input className={inputCls} value={v.supplier} onChange={(e) => update(i, { supplier: e.target.value })} /></Field>
          </div>
          <div className="mt-3">
            <DocumentUpload label="Visa Copy" value={v.visaCopyUrl ?? ""} onChange={(url) => update(i, { visaCopyUrl: url || null })} />
          </div>
        </div>
      ))}
      {visas.length === 0 && <p className="text-center py-8 text-sm text-slate-500">No visas yet. Click &quot;Add Visa&quot; to begin.</p>}
    </div>
  );
}
