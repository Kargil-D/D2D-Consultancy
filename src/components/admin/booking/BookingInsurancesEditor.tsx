"use client";

import { Plus, Trash2, Copy, ShieldCheck } from "lucide-react";
import DocumentUpload from "@/components/admin/booking/DocumentUpload";
import { Field, inputCls } from "@/components/admin/ui/Field";
import type { AdminBookingInsurance } from "@/types/admin";

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const newBookingInsurance = (): AdminBookingInsurance => ({
  id: newId(),
  insuranceCompany: "",
  policyNumber: "",
  planName: "",
  coverageAmount: 0,
  travelStartDate: null,
  travelEndDate: null,
  policyPdfUrl: null,
});

interface Props {
  insurances: AdminBookingInsurance[];
  onChange: (insurances: AdminBookingInsurance[]) => void;
}

const formatINR = (v: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", currencyDisplay: "code", maximumFractionDigits: 0 }).format(v);

export default function BookingInsurancesEditor({ insurances, onChange }: Props) {
  const update = (idx: number, patch: Partial<AdminBookingInsurance>) => {
    const next = [...insurances];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };
  const add = () => onChange([...insurances, newBookingInsurance()]);
  const duplicate = (idx: number) => {
    const copy = { ...insurances[idx], id: newId() };
    onChange([...insurances.slice(0, idx + 1), copy, ...insurances.slice(idx + 1)]);
  };
  const remove = (idx: number) => onChange(insurances.filter((_, i) => i !== idx));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-xs text-slate-500">Travel insurance policy details per traveller/booking.</p>
        <button type="button" onClick={add} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold">
          <Plus className="w-3.5 h-3.5" /> Add Insurance
        </button>
      </div>
      {insurances.map((ins, i) => (
        <div key={ins.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-slate-400" />
              <span className="font-bold text-slate-900">{ins.insuranceCompany || `Insurance ${i + 1}`}</span>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => duplicate(i)} className="p-1.5 rounded text-slate-500 hover:bg-slate-200" aria-label="Duplicate insurance"><Copy className="w-3.5 h-3.5" /></button>
              <button type="button" onClick={() => remove(i)} className="p-1.5 rounded text-rose-600 hover:bg-rose-50" aria-label="Delete insurance"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Insurance Company"><input className={inputCls} value={ins.insuranceCompany} onChange={(e) => update(i, { insuranceCompany: e.target.value })} /></Field>
            <Field label="Plan Name"><input className={inputCls} value={ins.planName} onChange={(e) => update(i, { planName: e.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <Field label="Policy Number"><input className={inputCls} value={ins.policyNumber} onChange={(e) => update(i, { policyNumber: e.target.value })} /></Field>
            <Field label="Coverage Amount">
              <input type="number" min={0} className={inputCls} value={ins.coverageAmount} onChange={(e) => update(i, { coverageAmount: Number(e.target.value) || 0 })} />
              <p className="mt-1 text-xs text-slate-400">{formatINR(ins.coverageAmount)}</p>
            </Field>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <Field label="Travel Start Date"><input type="date" className={inputCls} value={ins.travelStartDate ?? ""} onChange={(e) => update(i, { travelStartDate: e.target.value || null })} /></Field>
            <Field label="Travel End Date"><input type="date" className={inputCls} value={ins.travelEndDate ?? ""} onChange={(e) => update(i, { travelEndDate: e.target.value || null })} /></Field>
          </div>
          <div className="mt-3">
            <DocumentUpload label="Insurance Policy PDF" value={ins.policyPdfUrl ?? ""} onChange={(url) => update(i, { policyPdfUrl: url || null })} />
          </div>
        </div>
      ))}
      {insurances.length === 0 && <p className="text-center py-8 text-sm text-slate-500">No insurance policies yet. Click &quot;Add Insurance&quot; to begin.</p>}
    </div>
  );
}
