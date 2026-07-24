"use client";

import { Plus, Trash2, Copy, Plane } from "lucide-react";
import ImageUpload from "@/components/admin/ui/ImageUpload";
import { Field, inputCls } from "@/components/admin/ui/Field";
import type { AdminBookingFlight } from "@/types/admin";

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const newFlight = (): AdminBookingFlight => ({
  id: newId(),
  airline: "",
  flightNumber: "",
  pnr: "",
  ticketNumber: "",
  fromLocation: "",
  toLocation: "",
  departureAt: null,
  arrivalAt: null,
  cabinClass: "",
  baggage: "",
  meal: "",
  supplier: "",
  ticketUrl: null,
  voucherUrl: null,
});

interface Props {
  flights: AdminBookingFlight[];
  onChange: (flights: AdminBookingFlight[]) => void;
}

const toLocalInput = (v?: string | null) => (v ? v.slice(0, 16) : "");

export default function BookingFlightsEditor({ flights, onChange }: Props) {
  const update = (idx: number, patch: Partial<AdminBookingFlight>) => {
    const next = [...flights];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };
  const add = () => onChange([...flights, newFlight()]);
  const duplicate = (idx: number) => {
    const copy = { ...flights[idx], id: newId() };
    onChange([...flights.slice(0, idx + 1), copy, ...flights.slice(idx + 1)]);
  };
  const remove = (idx: number) => onChange(flights.filter((_, i) => i !== idx));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-xs text-slate-500">Airline, PNR, baggage/meal, tickets and vouchers per flight leg.</p>
        <button type="button" onClick={add} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold">
          <Plus className="w-3.5 h-3.5" /> Add Flight
        </button>
      </div>
      {flights.map((f, i) => (
        <div key={f.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Plane className="w-4 h-4 text-slate-400" />
              <span className="font-bold text-slate-900">{f.airline || `Flight ${i + 1}`} {f.flightNumber}</span>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => duplicate(i)} className="p-1.5 rounded text-slate-500 hover:bg-slate-200" aria-label="Duplicate flight"><Copy className="w-3.5 h-3.5" /></button>
              <button type="button" onClick={() => remove(i)} className="p-1.5 rounded text-rose-600 hover:bg-rose-50" aria-label="Delete flight"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Field label="Airline"><input className={inputCls} value={f.airline} onChange={(e) => update(i, { airline: e.target.value })} /></Field>
            <Field label="Flight Number"><input className={inputCls} value={f.flightNumber} onChange={(e) => update(i, { flightNumber: e.target.value })} /></Field>
            <Field label="PNR"><input className={inputCls} value={f.pnr} onChange={(e) => update(i, { pnr: e.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <Field label="From"><input className={inputCls} value={f.fromLocation} onChange={(e) => update(i, { fromLocation: e.target.value })} /></Field>
            <Field label="To"><input className={inputCls} value={f.toLocation} onChange={(e) => update(i, { toLocation: e.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <Field label="Departure"><input type="datetime-local" className={inputCls} value={toLocalInput(f.departureAt)} onChange={(e) => update(i, { departureAt: e.target.value || null })} /></Field>
            <Field label="Arrival"><input type="datetime-local" className={inputCls} value={toLocalInput(f.arrivalAt)} onChange={(e) => update(i, { arrivalAt: e.target.value || null })} /></Field>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
            <Field label="Cabin Class"><input className={inputCls} value={f.cabinClass} onChange={(e) => update(i, { cabinClass: e.target.value })} placeholder="Economy" /></Field>
            <Field label="Baggage"><input className={inputCls} value={f.baggage} onChange={(e) => update(i, { baggage: e.target.value })} placeholder="20kg" /></Field>
            <Field label="Meal"><input className={inputCls} value={f.meal} onChange={(e) => update(i, { meal: e.target.value })} /></Field>
            <Field label="Ticket Number"><input className={inputCls} value={f.ticketNumber} onChange={(e) => update(i, { ticketNumber: e.target.value })} /></Field>
          </div>
          <Field label="Supplier" className="mt-3"><input className={inputCls} value={f.supplier} onChange={(e) => update(i, { supplier: e.target.value })} /></Field>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <Field label="Flight Ticket"><ImageUpload value={f.ticketUrl ?? ""} onChange={(url) => update(i, { ticketUrl: url || null })} label="Upload ticket" aspect="4/3" /></Field>
            <Field label="Flight Voucher"><ImageUpload value={f.voucherUrl ?? ""} onChange={(url) => update(i, { voucherUrl: url || null })} label="Upload voucher" aspect="4/3" /></Field>
          </div>
        </div>
      ))}
      {flights.length === 0 && <p className="text-center py-8 text-sm text-slate-500">No flights yet. Click &quot;Add Flight&quot; to begin.</p>}
    </div>
  );
}
