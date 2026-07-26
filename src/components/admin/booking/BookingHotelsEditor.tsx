"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { selectCls } from "@/components/admin/ui/Field";
import { GridField as Field, PAYMENT_MODES, cellInputCls, formatINR, readonlyBoxCls } from "@/components/admin/booking/BookingGridField";
import type { AdminBookingCostSheetEntry, AdminBookingHotel, PaymentMode } from "@/types/admin";

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const newBookingHotel = (): AdminBookingHotel => ({
  id: newId(),
  hotelName: "",
  hotelCategory: "",
  checkIn: null,
  checkOut: null,
  nights: 0,
  rooms: 1,
  roomCategory: "",
  roomType: "",
  mealPlan: "",
  occupancy: "",
  amenities: [],
  hotelAddress: "",
  googleMapLink: null,
  hotelContactNumber: "",
  supplier: "",
  voucherUrl: null,
  bookedCurrency: "INR",
  paymentMode: "Cash",
  bookingDate: null,
  bookingPnr: "",
  updatedBy: "",
});

/** Read-only pricing/option context mirrored from the linked Quotation's Pricing step, keyed by the hotel row's id (reused from the Quotation hotel selection id at auto-load time). */
export interface HotelQuotationMeta {
  optionLabel: string;
  currencyCode: string;
  cost: number;
  qty: number;
}

interface Props {
  hotels: AdminBookingHotel[];
  onChange: (hotels: AdminBookingHotel[]) => void;
  costSheet: AdminBookingCostSheetEntry[];
  onBookedCostChange: (sourceId: string, bookingCost: number) => void;
  onSettlementCostChange: (sourceId: string, settlementCost: number) => void;
  quotationMeta: Map<string, HotelQuotationMeta>;
  currencyOptions: string[];
}

export default function BookingHotelsEditor({ hotels, onChange, costSheet, onBookedCostChange, onSettlementCostChange, quotationMeta, currencyOptions }: Props) {
  const [liveBookingCost, setLiveBookingCost] = useState<Record<string, number>>({});
  const [liveSettlementCost, setLiveSettlementCost] = useState<Record<string, number>>({});

  const update = (idx: number, patch: Partial<AdminBookingHotel>) => {
    const next = [...hotels];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };
  const add = () => onChange([...hotels, newBookingHotel()]);
  const remove = (idx: number) => onChange(hotels.filter((_, i) => i !== idx));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-xs text-slate-500">Auto-synced from the Quotation&apos;s Pricing step — D2D Cost is read-only here. Balance = Booked Cost − Settlement Cost.</p>
        <button type="button" onClick={add} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold">
          <Plus className="w-3.5 h-3.5" /> Add Hotel
        </button>
      </div>

      <div className="space-y-3">
        {hotels.map((h, i) => {
          const meta = h.id ? quotationMeta.get(h.id) : undefined;
          const costEntry = h.id ? costSheet.find((e) => e.sourceId === h.id) : undefined;
          const totalCost = meta ? meta.qty * meta.cost : undefined;
          const bookingCost = h.id && h.id in liveBookingCost ? liveBookingCost[h.id] : (costEntry?.bookingCost ?? undefined);
          const settlementCost = h.id && h.id in liveSettlementCost ? liveSettlementCost[h.id] : (costEntry?.settlementCost ?? undefined);
          const balance = bookingCost !== undefined && settlementCost !== undefined ? bookingCost - settlementCost : undefined;

          return (
            <div key={h.id ?? i} className="rounded-xl border border-slate-100 p-3 space-y-3">
              {/* Row 1 */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <Field label="Hotel Name" className="lg:col-span-2">
                  <input className={cellInputCls} value={h.hotelName} onChange={(e) => update(i, { hotelName: e.target.value })} />
                </Field>
                <Field label="Nights">
                  <input
                    type="number"
                    min={0}
                    className={`${cellInputCls} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                    value={h.nights}
                    onChange={(e) => update(i, { nights: Number(e.target.value) || 0 })}
                  />
                </Field>
                <Field label="Rooms">
                  <input
                    type="number"
                    min={1}
                    className={`${cellInputCls} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                    value={h.rooms}
                    onChange={(e) => update(i, { rooms: Number(e.target.value) || 1 })}
                  />
                </Field>
                <Field label="D2D Cost">
                  <div className={`${readonlyBoxCls} justify-end text-right font-semibold text-slate-900`}>
                    {totalCost !== undefined ? formatINR(totalCost) : "—"}
                  </div>
                </Field>
                <Field label="Supplier Name">
                  <input className={cellInputCls} value={h.supplier} onChange={(e) => update(i, { supplier: e.target.value })} />
                </Field>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-8 gap-3">
                <Field label="Booked Cost">
                  {costEntry ? (
                    <input
                      type="number"
                      min={0}
                      className={cellInputCls}
                      defaultValue={costEntry.bookingCost}
                      onChange={(e) => setLiveBookingCost((prev) => ({ ...prev, [h.id ?? ""]: Number(e.target.value) || 0 }))}
                      onBlur={(e) => {
                        const next = Number(e.target.value) || 0;
                        if (next !== costEntry.bookingCost) onBookedCostChange(h.id ?? "", next);
                      }}
                    />
                  ) : (
                    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-2 py-2 text-xs text-slate-400">Save row first</div>
                  )}
                </Field>
                <Field label="Booked Currency">
                  <select className={selectCls} value={h.bookedCurrency} onChange={(e) => update(i, { bookedCurrency: e.target.value })}>
                    {currencyOptions.map((c) => (<option key={c} value={c}>{c}</option>))}
                  </select>
                </Field>
                <Field label="Settlement Cost">
                  {costEntry ? (
                    <input
                      type="number"
                      min={0}
                      className={cellInputCls}
                      defaultValue={costEntry.settlementCost}
                      onChange={(e) => setLiveSettlementCost((prev) => ({ ...prev, [h.id ?? ""]: Number(e.target.value) || 0 }))}
                      onBlur={(e) => {
                        const next = Number(e.target.value) || 0;
                        if (next !== costEntry.settlementCost) onSettlementCostChange(h.id ?? "", next);
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
                  <select className={selectCls} value={h.paymentMode} onChange={(e) => update(i, { paymentMode: e.target.value as PaymentMode })}>
                    {PAYMENT_MODES.map((m) => (<option key={m} value={m}>{m}</option>))}
                  </select>
                </Field>
                <Field label="Booking Date">
                  <input type="date" className={cellInputCls} value={h.bookingDate ?? ""} onChange={(e) => update(i, { bookingDate: e.target.value || null })} />
                </Field>
                <Field label="Booking PNR">
                  <input className={cellInputCls} value={h.bookingPnr} onChange={(e) => update(i, { bookingPnr: e.target.value })} />
                </Field>
                <Field label="Updated By">
                  <input className={cellInputCls} value={h.updatedBy} onChange={(e) => update(i, { updatedBy: e.target.value })} />
                </Field>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove Hotel
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {hotels.length === 0 && <p className="text-center py-8 text-sm text-slate-500">No hotels yet. Click &quot;Add Hotel&quot; to begin.</p>}
    </div>
  );
}
