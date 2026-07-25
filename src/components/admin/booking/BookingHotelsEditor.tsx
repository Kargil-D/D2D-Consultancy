"use client";

import { Plus, Trash2, Copy, BedDouble } from "lucide-react";
import DocumentUpload from "@/components/admin/booking/DocumentUpload";
import TagInput from "@/components/admin/ui/TagInput";
import { Field, inputCls } from "@/components/admin/ui/Field";
import BookedCostField from "@/components/admin/booking/BookedCostField";
import type { AdminBookingCostSheetEntry, AdminBookingHotel } from "@/types/admin";

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
});

interface Props {
  hotels: AdminBookingHotel[];
  onChange: (hotels: AdminBookingHotel[]) => void;
  costSheet: AdminBookingCostSheetEntry[];
  onBookedCostChange: (sourceId: string, bookingCost: number) => void;
}

export default function BookingHotelsEditor({ hotels, onChange, costSheet, onBookedCostChange }: Props) {
  const update = (idx: number, patch: Partial<AdminBookingHotel>) => {
    const next = [...hotels];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };
  const add = () => onChange([...hotels, newBookingHotel()]);
  const duplicate = (idx: number) => {
    const copy = { ...hotels[idx], id: newId() };
    onChange([...hotels.slice(0, idx + 1), copy, ...hotels.slice(idx + 1)]);
  };
  const remove = (idx: number) => onChange(hotels.filter((_, i) => i !== idx));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-xs text-slate-500">Room type, meal plan, occupancy, amenities and the confirmed hotel voucher.</p>
        <button type="button" onClick={add} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold">
          <Plus className="w-3.5 h-3.5" /> Add Hotel
        </button>
      </div>
      {hotels.map((h, i) => (
        <div key={h.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BedDouble className="w-4 h-4 text-slate-400" />
              <span className="font-bold text-slate-900">{h.hotelName || `Hotel ${i + 1}`}</span>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => duplicate(i)} className="p-1.5 rounded text-slate-500 hover:bg-slate-200" aria-label="Duplicate hotel"><Copy className="w-3.5 h-3.5" /></button>
              <button type="button" onClick={() => remove(i)} className="p-1.5 rounded text-rose-600 hover:bg-rose-50" aria-label="Delete hotel"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>

          <div className="mb-3 max-w-[200px]">
            <BookedCostField sourceId={h.id ?? ""} costSheet={costSheet} onChange={onBookedCostChange} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Hotel Name"><input className={inputCls} value={h.hotelName} onChange={(e) => update(i, { hotelName: e.target.value })} /></Field>
            <Field label="Hotel Category"><input className={inputCls} value={h.hotelCategory} onChange={(e) => update(i, { hotelCategory: e.target.value })} placeholder="5-Star" /></Field>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
            <Field label="Check-in"><input type="date" className={inputCls} value={h.checkIn ?? ""} onChange={(e) => update(i, { checkIn: e.target.value || null })} /></Field>
            <Field label="Check-out"><input type="date" className={inputCls} value={h.checkOut ?? ""} onChange={(e) => update(i, { checkOut: e.target.value || null })} /></Field>
            <Field label="Nights"><input type="number" min={0} className={inputCls} value={h.nights} onChange={(e) => update(i, { nights: Number(e.target.value) || 0 })} /></Field>
            <Field label="Rooms"><input type="number" min={1} className={inputCls} value={h.rooms} onChange={(e) => update(i, { rooms: Number(e.target.value) || 1 })} /></Field>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
            <Field label="Room Category"><input className={inputCls} value={h.roomCategory} onChange={(e) => update(i, { roomCategory: e.target.value })} /></Field>
            <Field label="Room Type"><input className={inputCls} value={h.roomType} onChange={(e) => update(i, { roomType: e.target.value })} placeholder="Deluxe Room" /></Field>
            <Field label="Meal Plan"><input className={inputCls} value={h.mealPlan} onChange={(e) => update(i, { mealPlan: e.target.value })} /></Field>
          </div>
          <Field label="Occupancy" className="mt-3"><input className={inputCls} value={h.occupancy} onChange={(e) => update(i, { occupancy: e.target.value })} placeholder="2 Adults + 1 Child" /></Field>
          <Field label="Amenities" className="mt-3"><TagInput value={h.amenities} onChange={(v) => update(i, { amenities: v })} placeholder="Pool, WiFi" /></Field>
          <Field label="Hotel Address" className="mt-3"><input className={inputCls} value={h.hotelAddress} onChange={(e) => update(i, { hotelAddress: e.target.value })} /></Field>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <Field label="Google Map Link"><input className={inputCls} value={h.googleMapLink ?? ""} onChange={(e) => update(i, { googleMapLink: e.target.value || null })} /></Field>
            <Field label="Hotel Contact Number"><input className={inputCls} value={h.hotelContactNumber} onChange={(e) => update(i, { hotelContactNumber: e.target.value })} /></Field>
          </div>
          <Field label="Supplier" className="mt-3"><input className={inputCls} value={h.supplier} onChange={(e) => update(i, { supplier: e.target.value })} /></Field>
          <div className="mt-3">
            <DocumentUpload label="Hotel Voucher" value={h.voucherUrl ?? ""} onChange={(url) => update(i, { voucherUrl: url || null })} />
          </div>
        </div>
      ))}
      {hotels.length === 0 && <p className="text-center py-8 text-sm text-slate-500">No hotels yet. Click &quot;Add Hotel&quot; to begin.</p>}
    </div>
  );
}
