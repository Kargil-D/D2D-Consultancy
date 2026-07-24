"use client";

import { Plus, Trash2, Copy, ArrowRightLeft } from "lucide-react";
import ImageUpload from "@/components/admin/ui/ImageUpload";
import { Field, inputCls, selectCls } from "@/components/admin/ui/Field";
import BookedCostField from "@/components/admin/booking/BookedCostField";
import type { AdminBookingCostSheetEntry, AdminBookingTransfer, TourType } from "@/types/admin";

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const newBookingTransfer = (): AdminBookingTransfer => ({
  id: newId(),
  transferType: "",
  vehicleType: "",
  mode: "Private",
  pickupAt: null,
  pickupLocation: "",
  dropLocation: "",
  driverName: "",
  driverMobile: "",
  vehicleNumber: "",
  supplier: "",
  voucherUrl: null,
});

interface Props {
  transfers: AdminBookingTransfer[];
  onChange: (transfers: AdminBookingTransfer[]) => void;
  costSheet: AdminBookingCostSheetEntry[];
  onBookedCostChange: (sourceId: string, bookingCost: number) => void;
}

const toLocalInput = (v?: string | null) => (v ? v.slice(0, 16) : "");

export default function BookingTransfersEditor({ transfers, onChange, costSheet, onBookedCostChange }: Props) {
  const update = (idx: number, patch: Partial<AdminBookingTransfer>) => {
    const next = [...transfers];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };
  const add = () => onChange([...transfers, newBookingTransfer()]);
  const duplicate = (idx: number) => {
    const copy = { ...transfers[idx], id: newId() };
    onChange([...transfers.slice(0, idx + 1), copy, ...transfers.slice(idx + 1)]);
  };
  const remove = (idx: number) => onChange(transfers.filter((_, i) => i !== idx));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-xs text-slate-500">Airport Transfer, Hotel Transfer, Intercity Transfer, Private Cab, etc.</p>
        <button type="button" onClick={add} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold">
          <Plus className="w-3.5 h-3.5" /> Add Transfer
        </button>
      </div>
      {transfers.map((t, i) => (
        <div key={t.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-slate-400" />
              <span className="font-bold text-slate-900">{t.transferType || `Transfer ${i + 1}`}</span>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => duplicate(i)} className="p-1.5 rounded text-slate-500 hover:bg-slate-200" aria-label="Duplicate transfer"><Copy className="w-3.5 h-3.5" /></button>
              <button type="button" onClick={() => remove(i)} className="p-1.5 rounded text-rose-600 hover:bg-rose-50" aria-label="Delete transfer"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>

          <div className="mb-3 max-w-[200px]">
            <BookedCostField sourceId={t.id ?? ""} costSheet={costSheet} onChange={onBookedCostChange} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Field label="Transfer Type"><input className={inputCls} value={t.transferType} onChange={(e) => update(i, { transferType: e.target.value })} placeholder="Airport Transfer" /></Field>
            <Field label="Vehicle Type"><input className={inputCls} value={t.vehicleType} onChange={(e) => update(i, { vehicleType: e.target.value })} placeholder="Sedan" /></Field>
            <Field label="Private / SIC">
              <select className={selectCls} value={t.mode} onChange={(e) => update(i, { mode: e.target.value as TourType })}>
                <option value="Private">Private</option>
                <option value="SIC">SIC</option>
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <Field label="Pickup Date & Time"><input type="datetime-local" className={inputCls} value={toLocalInput(t.pickupAt)} onChange={(e) => update(i, { pickupAt: e.target.value || null })} /></Field>
            <div />
            <Field label="Pickup Location"><input className={inputCls} value={t.pickupLocation} onChange={(e) => update(i, { pickupLocation: e.target.value })} /></Field>
            <Field label="Drop Location"><input className={inputCls} value={t.dropLocation} onChange={(e) => update(i, { dropLocation: e.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
            <Field label="Driver Name"><input className={inputCls} value={t.driverName} onChange={(e) => update(i, { driverName: e.target.value })} /></Field>
            <Field label="Driver Mobile"><input className={inputCls} value={t.driverMobile} onChange={(e) => update(i, { driverMobile: e.target.value })} /></Field>
            <Field label="Vehicle Number"><input className={inputCls} value={t.vehicleNumber} onChange={(e) => update(i, { vehicleNumber: e.target.value })} /></Field>
          </div>
          <Field label="Supplier" className="mt-3"><input className={inputCls} value={t.supplier} onChange={(e) => update(i, { supplier: e.target.value })} /></Field>
          <Field label="Transfer Voucher" className="mt-3"><ImageUpload value={t.voucherUrl ?? ""} onChange={(url) => update(i, { voucherUrl: url || null })} label="Upload voucher" aspect="4/3" /></Field>
        </div>
      ))}
      {transfers.length === 0 && <p className="text-center py-8 text-sm text-slate-500">No transfers yet. Click &quot;Add Transfer&quot; to begin.</p>}
    </div>
  );
}
