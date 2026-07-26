"use client";

import { useState } from "react";
import { Plus, Trash2, Copy, ArrowRightLeft } from "lucide-react";
import DocumentUpload from "@/components/admin/booking/DocumentUpload";
import GenerateVoucherLink from "@/components/admin/booking/GenerateVoucherLink";
import { selectCls } from "@/components/admin/ui/Field";
import { GridField as Field, PAYMENT_MODES, cellInputCls, formatINR, readonlyBoxCls } from "@/components/admin/booking/BookingGridField";
import type { AdminBookingCostSheetEntry, AdminBookingTransfer, PaymentMode, TourType } from "@/types/admin";

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
  invoiceUrl: null,
  bookedCurrency: "INR",
  paymentMode: "Cash",
  bookingDate: null,
  bookingPnr: "",
  updatedBy: "",
});

/** Read-only pricing context mirrored from the linked Quotation's Pricing step, keyed by the transfer row's id (reused from the Quotation transfer's own id when loaded in from the Quotation). */
export interface TransferQuotationMeta {
  cost: number;
  qty: number;
}

interface Props {
  bookingId: string;
  transfers: AdminBookingTransfer[];
  onChange: (transfers: AdminBookingTransfer[]) => void;
  costSheet: AdminBookingCostSheetEntry[];
  onBookedCostChange: (sourceId: string, bookingCost: number) => void;
  onSettlementCostChange: (sourceId: string, settlementCost: number) => void;
  quotationMeta?: Map<string, TransferQuotationMeta>;
  currencyOptions: string[];
}

const toLocalInput = (v?: string | null) => (v ? v.slice(0, 16) : "");

export default function BookingTransfersEditor({
  bookingId, transfers, onChange, costSheet, onBookedCostChange, onSettlementCostChange, quotationMeta, currencyOptions,
}: Props) {
  const [liveBookingCost, setLiveBookingCost] = useState<Record<string, number>>({});
  const [liveSettlementCost, setLiveSettlementCost] = useState<Record<string, number>>({});

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
        <p className="text-xs text-slate-500">Auto-synced from the Quotation&apos;s Pricing step — D2D Cost is read-only here. Balance = Booked Cost − Settlement Cost.</p>
        <button type="button" onClick={add} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold">
          <Plus className="w-3.5 h-3.5" /> Add Transfer
        </button>
      </div>

      <div className="space-y-3">
        {transfers.map((t, i) => {
          const meta = t.id ? quotationMeta?.get(t.id) : undefined;
          const costEntry = t.id ? costSheet.find((e) => e.sourceId === t.id) : undefined;
          const totalCost = meta ? meta.qty * meta.cost : undefined;
          const bookingCost = t.id && t.id in liveBookingCost ? liveBookingCost[t.id] : (costEntry?.bookingCost ?? undefined);
          const settlementCost = t.id && t.id in liveSettlementCost ? liveSettlementCost[t.id] : (costEntry?.settlementCost ?? undefined);
          const balance = bookingCost !== undefined && settlementCost !== undefined ? bookingCost - settlementCost : undefined;

          return (
            <div key={t.id ?? i} className="rounded-xl border border-slate-100 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-slate-400" />
                  <span className="font-bold text-slate-900">{t.transferType || `Transfer ${i + 1}`}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => duplicate(i)} className="p-1.5 rounded text-slate-500 hover:bg-slate-200" aria-label="Duplicate transfer"><Copy className="w-3.5 h-3.5" /></button>
                  <button type="button" onClick={() => remove(i)} className="p-1.5 rounded text-rose-600 hover:bg-rose-50" aria-label="Delete transfer"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>

              {/* Row 1 — identity & timing */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Field label="Transfer Type">
                  <input className={cellInputCls} value={t.transferType} onChange={(e) => update(i, { transferType: e.target.value })} placeholder="Airport Transfer" />
                </Field>
                <Field label="Vehicle Type">
                  <input className={cellInputCls} value={t.vehicleType} onChange={(e) => update(i, { vehicleType: e.target.value })} placeholder="Sedan" />
                </Field>
                <Field label="Private / SIC">
                  <select className={selectCls} value={t.mode} onChange={(e) => update(i, { mode: e.target.value as TourType })}>
                    <option value="Private">Private</option>
                    <option value="SIC">SIC</option>
                  </select>
                </Field>
                <Field label="Pickup Date & Time">
                  <input type="datetime-local" className={cellInputCls} value={toLocalInput(t.pickupAt)} onChange={(e) => update(i, { pickupAt: e.target.value || null })} />
                </Field>
              </div>

              {/* Row 2 — route & vehicle */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <Field label="Pickup Location">
                  <input className={cellInputCls} value={t.pickupLocation} onChange={(e) => update(i, { pickupLocation: e.target.value })} />
                </Field>
                <Field label="Drop Location">
                  <input className={cellInputCls} value={t.dropLocation} onChange={(e) => update(i, { dropLocation: e.target.value })} />
                </Field>
                <Field label="Driver Name">
                  <input className={cellInputCls} value={t.driverName} onChange={(e) => update(i, { driverName: e.target.value })} />
                </Field>
                <Field label="Driver Mobile">
                  <input className={cellInputCls} value={t.driverMobile} onChange={(e) => update(i, { driverMobile: e.target.value })} />
                </Field>
                <Field label="Vehicle Number">
                  <input className={cellInputCls} value={t.vehicleNumber} onChange={(e) => update(i, { vehicleNumber: e.target.value })} />
                </Field>
              </div>

              {/* Row 3 — cost */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Field label="D2D Cost">
                  <div className={`${readonlyBoxCls} justify-end text-right font-semibold text-slate-900`}>
                    {totalCost !== undefined ? formatINR(totalCost) : "—"}
                  </div>
                </Field>
                <Field label="Booked Cost">
                  {costEntry ? (
                    <input
                      type="number"
                      min={0}
                      className={cellInputCls}
                      defaultValue={costEntry.bookingCost}
                      onChange={(e) => setLiveBookingCost((prev) => ({ ...prev, [t.id ?? ""]: Number(e.target.value) || 0 }))}
                      onBlur={(e) => {
                        const next = Number(e.target.value) || 0;
                        if (next !== costEntry.bookingCost) onBookedCostChange(t.id ?? "", next);
                      }}
                    />
                  ) : (
                    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-2 py-2 text-xs text-slate-400">Save row first</div>
                  )}
                </Field>
                <Field label="Booked Currency">
                  <select className={selectCls} value={t.bookedCurrency} onChange={(e) => update(i, { bookedCurrency: e.target.value })}>
                    {currencyOptions.map((c) => (<option key={c} value={c}>{c}</option>))}
                  </select>
                </Field>
                <Field label="Supplier Name">
                  <input className={cellInputCls} value={t.supplier} onChange={(e) => update(i, { supplier: e.target.value })} />
                </Field>
              </div>

              {/* Row 4 — booking & payment */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <Field label="Settlement Cost">
                  {costEntry ? (
                    <input
                      type="number"
                      min={0}
                      className={cellInputCls}
                      defaultValue={costEntry.settlementCost}
                      onChange={(e) => setLiveSettlementCost((prev) => ({ ...prev, [t.id ?? ""]: Number(e.target.value) || 0 }))}
                      onBlur={(e) => {
                        const next = Number(e.target.value) || 0;
                        if (next !== costEntry.settlementCost) onSettlementCostChange(t.id ?? "", next);
                      }}
                    />
                  ) : (
                    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-2 py-2 text-xs text-slate-400">Save row first</div>
                  )}
                </Field>
                <Field label="Balance">
                  <div
                    className={`${readonlyBoxCls} justify-end text-right font-semibold ${
                      balance !== undefined && balance < 0 ? "text-rose-600" : "text-emerald-600"
                    }`}
                  >
                    {balance !== undefined ? formatINR(balance) : "—"}
                  </div>
                </Field>
                <Field label="Payment Mode">
                  <select className={selectCls} value={t.paymentMode} onChange={(e) => update(i, { paymentMode: e.target.value as PaymentMode })}>
                    {PAYMENT_MODES.map((m) => (<option key={m} value={m}>{m}</option>))}
                  </select>
                </Field>
                <Field label="Booking Date">
                  <input type="date" className={cellInputCls} value={t.bookingDate ?? ""} onChange={(e) => update(i, { bookingDate: e.target.value || null })} />
                </Field>
                <Field label="Booking PNR">
                  <input className={cellInputCls} value={t.bookingPnr} onChange={(e) => update(i, { bookingPnr: e.target.value })} />
                </Field>
                <Field label="Updated By">
                  <input className={cellInputCls} value={t.updatedBy} onChange={(e) => update(i, { updatedBy: e.target.value })} />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <GenerateVoucherLink label="Transfer Voucher" href={costEntry && t.id ? `/api/admin/bookings/${bookingId}/transfers/${t.id}/voucher` : undefined} />
                <DocumentUpload label="Transfer Invoice" value={t.invoiceUrl ?? ""} onChange={(url) => update(i, { invoiceUrl: url || null })} />
              </div>
            </div>
          );
        })}
      </div>
      {transfers.length === 0 && <p className="text-center py-8 text-sm text-slate-500">No transfers yet. Click &quot;Add Transfer&quot; to begin.</p>}
    </div>
  );
}
