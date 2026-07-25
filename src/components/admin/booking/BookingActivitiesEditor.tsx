"use client";

import { useState } from "react";
import { Plus, Trash2, Copy, Ticket } from "lucide-react";
import DocumentUpload from "@/components/admin/booking/DocumentUpload";
import { selectCls, textareaCls } from "@/components/admin/ui/Field";
import { GridField as Field, PAYMENT_MODES, cellInputCls, formatINR, readonlyBoxCls } from "@/components/admin/booking/BookingGridField";
import type { AdminBookingActivity, AdminBookingCostSheetEntry, PaymentMode, TourType } from "@/types/admin";

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const newBookingActivity = (): AdminBookingActivity => ({
  id: newId(),
  activityName: "",
  activityDate: null,
  activityTime: "",
  duration: "",
  tourType: "Private",
  pickupIncluded: false,
  pickupTime: "",
  pax: 1,
  inclusions: "",
  exclusions: "",
  supplier: "",
  voucherUrl: null,
  paymentMode: "Cash",
  bookingDate: null,
  bookingPnr: "",
  updatedBy: "",
});

/** Read-only pricing context mirrored from the linked Quotation's Pricing step, keyed by the activity row's id (reused from the Quotation activity's own id when loaded in from the Quotation). */
export interface ActivityQuotationMeta {
  cost: number;
  qty: number;
}

interface Props {
  activities: AdminBookingActivity[];
  onChange: (activities: AdminBookingActivity[]) => void;
  costSheet: AdminBookingCostSheetEntry[];
  onBookedCostChange: (sourceId: string, bookingCost: number) => void;
  quotationMeta?: Map<string, ActivityQuotationMeta>;
}

export default function BookingActivitiesEditor({ activities, onChange, costSheet, onBookedCostChange, quotationMeta }: Props) {
  const [liveBookingCost, setLiveBookingCost] = useState<Record<string, number>>({});

  const update = (idx: number, patch: Partial<AdminBookingActivity>) => {
    const next = [...activities];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };
  const add = () => onChange([...activities, newBookingActivity()]);
  const duplicate = (idx: number) => {
    const copy = { ...activities[idx], id: newId() };
    onChange([...activities.slice(0, idx + 1), copy, ...activities.slice(idx + 1)]);
  };
  const remove = (idx: number) => onChange(activities.filter((_, i) => i !== idx));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-xs text-slate-500">Auto-synced from the Quotation&apos;s Pricing step — D2D Cost/Total Cost are read-only here. Balance = Total Cost − Booking Cost.</p>
        <button type="button" onClick={add} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold">
          <Plus className="w-3.5 h-3.5" /> Add Activity
        </button>
      </div>

      <div className="space-y-3">
        {activities.map((a, i) => {
          const meta = a.id ? quotationMeta?.get(a.id) : undefined;
          const costEntry = a.id ? costSheet.find((e) => e.sourceId === a.id) : undefined;
          const totalCost = meta ? meta.qty * meta.cost : undefined;
          const bookingCost = a.id && a.id in liveBookingCost ? liveBookingCost[a.id] : (costEntry?.bookingCost ?? undefined);
          const balance = totalCost !== undefined && bookingCost !== undefined ? totalCost - bookingCost : undefined;

          return (
            <div key={a.id ?? i} className="rounded-xl border border-slate-100 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-slate-400" />
                  <span className="font-bold text-slate-900">{a.activityName || `Activity ${i + 1}`}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => duplicate(i)} className="p-1.5 rounded text-slate-500 hover:bg-slate-200" aria-label="Duplicate activity"><Copy className="w-3.5 h-3.5" /></button>
                  <button type="button" onClick={() => remove(i)} className="p-1.5 rounded text-rose-600 hover:bg-rose-50" aria-label="Delete activity"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>

              {/* Row 1 — identity & timing */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <Field label="Activity Name" className="lg:col-span-2">
                  <input className={cellInputCls} value={a.activityName} onChange={(e) => update(i, { activityName: e.target.value })} />
                </Field>
                <Field label="Activity Date">
                  <input type="date" className={cellInputCls} value={a.activityDate ?? ""} onChange={(e) => update(i, { activityDate: e.target.value || null })} />
                </Field>
                <Field label="Activity Time">
                  <input type="time" className={cellInputCls} value={a.activityTime} onChange={(e) => update(i, { activityTime: e.target.value })} />
                </Field>
                <Field label="Duration">
                  <input className={cellInputCls} value={a.duration} onChange={(e) => update(i, { duration: e.target.value })} placeholder="4 hours" />
                </Field>
                <Field label="Tour Type">
                  <select className={selectCls} value={a.tourType} onChange={(e) => update(i, { tourType: e.target.value as TourType })}>
                    <option value="Private">Private</option>
                    <option value="SIC">SIC</option>
                  </select>
                </Field>
              </div>

              {/* Row 2 — pickup & pax */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Field label="Pickup Included">
                  <select className={selectCls} value={a.pickupIncluded ? "yes" : "no"} onChange={(e) => update(i, { pickupIncluded: e.target.value === "yes" })}>
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </Field>
                <Field label="Pickup Time">
                  <input type="time" className={cellInputCls} value={a.pickupTime} onChange={(e) => update(i, { pickupTime: e.target.value })} />
                </Field>
                <Field label="No. of Pax">
                  <input
                    type="number"
                    min={1}
                    className={`${cellInputCls} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                    value={a.pax}
                    onChange={(e) => update(i, { pax: Number(e.target.value) || 1 })}
                  />
                </Field>
              </div>

              {/* Row 3 — cost */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Field label="D2D Cost">
                  <div className={`${readonlyBoxCls} text-slate-600`}>{meta ? formatINR(meta.cost) : "—"}</div>
                </Field>
                <Field label="Total Cost">
                  <div className={`${readonlyBoxCls} justify-end text-right font-semibold text-slate-900`}>
                    {totalCost !== undefined ? formatINR(totalCost) : "—"}
                  </div>
                </Field>
                <Field label="Supplier Name">
                  <input className={cellInputCls} value={a.supplier} onChange={(e) => update(i, { supplier: e.target.value })} />
                </Field>
              </div>

              {/* Row 4 — booking & payment */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <Field label="Booking Cost">
                  {costEntry ? (
                    <input
                      type="number"
                      min={0}
                      className={cellInputCls}
                      defaultValue={costEntry.bookingCost}
                      onChange={(e) => setLiveBookingCost((prev) => ({ ...prev, [a.id ?? ""]: Number(e.target.value) || 0 }))}
                      onBlur={(e) => {
                        const next = Number(e.target.value) || 0;
                        if (next !== costEntry.bookingCost) onBookedCostChange(a.id ?? "", next);
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
                  <select className={selectCls} value={a.paymentMode} onChange={(e) => update(i, { paymentMode: e.target.value as PaymentMode })}>
                    {PAYMENT_MODES.map((m) => (<option key={m} value={m}>{m}</option>))}
                  </select>
                </Field>
                <Field label="Booking Date">
                  <input type="date" className={cellInputCls} value={a.bookingDate ?? ""} onChange={(e) => update(i, { bookingDate: e.target.value || null })} />
                </Field>
                <Field label="Booking PNR">
                  <input className={cellInputCls} value={a.bookingPnr} onChange={(e) => update(i, { bookingPnr: e.target.value })} />
                </Field>
                <Field label="Updated By">
                  <input className={cellInputCls} value={a.updatedBy} onChange={(e) => update(i, { updatedBy: e.target.value })} />
                </Field>
              </div>

              {/* Row 5 — inclusions/exclusions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Inclusions">
                  <textarea className={textareaCls} value={a.inclusions} onChange={(e) => update(i, { inclusions: e.target.value })} />
                </Field>
                <Field label="Exclusions">
                  <textarea className={textareaCls} value={a.exclusions} onChange={(e) => update(i, { exclusions: e.target.value })} />
                </Field>
              </div>

              <DocumentUpload label="Activity Voucher" value={a.voucherUrl ?? ""} onChange={(url) => update(i, { voucherUrl: url || null })} />
            </div>
          );
        })}
      </div>
      {activities.length === 0 && <p className="text-center py-8 text-sm text-slate-500">No activities yet. Click &quot;Add Activity&quot; to begin.</p>}
    </div>
  );
}
