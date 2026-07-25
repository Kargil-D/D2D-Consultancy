"use client";

import { Plus, Trash2, Copy, Ticket } from "lucide-react";
import DocumentUpload from "@/components/admin/booking/DocumentUpload";
import { Field, inputCls, selectCls, textareaCls } from "@/components/admin/ui/Field";
import BookedCostField from "@/components/admin/booking/BookedCostField";
import type { AdminBookingActivity, AdminBookingCostSheetEntry, TourType } from "@/types/admin";

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
  pickupLocation: "",
  meetingPoint: "",
  dropLocation: "",
  inclusions: "",
  exclusions: "",
  supplier: "",
  voucherUrl: null,
});

interface Props {
  activities: AdminBookingActivity[];
  onChange: (activities: AdminBookingActivity[]) => void;
  costSheet: AdminBookingCostSheetEntry[];
  onBookedCostChange: (sourceId: string, bookingCost: number) => void;
}

export default function BookingActivitiesEditor({ activities, onChange, costSheet, onBookedCostChange }: Props) {
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
        <p className="text-xs text-slate-500">e.g. Safari World, Coral Island, Sky Walk.</p>
        <button type="button" onClick={add} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold">
          <Plus className="w-3.5 h-3.5" /> Add Activity
        </button>
      </div>
      {activities.map((a, i) => (
        <div key={a.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Ticket className="w-4 h-4 text-slate-400" />
              <span className="font-bold text-slate-900">{a.activityName || `Activity ${i + 1}`}</span>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => duplicate(i)} className="p-1.5 rounded text-slate-500 hover:bg-slate-200" aria-label="Duplicate activity"><Copy className="w-3.5 h-3.5" /></button>
              <button type="button" onClick={() => remove(i)} className="p-1.5 rounded text-rose-600 hover:bg-rose-50" aria-label="Delete activity"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>

          <div className="mb-3 max-w-[200px]">
            <BookedCostField sourceId={a.id ?? ""} costSheet={costSheet} onChange={onBookedCostChange} />
          </div>

          <Field label="Activity Name"><input className={inputCls} value={a.activityName} onChange={(e) => update(i, { activityName: e.target.value })} /></Field>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
            <Field label="Activity Date"><input type="date" className={inputCls} value={a.activityDate ?? ""} onChange={(e) => update(i, { activityDate: e.target.value || null })} /></Field>
            <Field label="Activity Time"><input type="time" className={inputCls} value={a.activityTime} onChange={(e) => update(i, { activityTime: e.target.value })} /></Field>
            <Field label="Duration"><input className={inputCls} value={a.duration} onChange={(e) => update(i, { duration: e.target.value })} placeholder="4 hours" /></Field>
            <Field label="Tour Type">
              <select className={selectCls} value={a.tourType} onChange={(e) => update(i, { tourType: e.target.value as TourType })}>
                <option value="Private">Private</option>
                <option value="SIC">SIC</option>
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 items-end">
            <Field label="Pickup Included">
              <select className={selectCls} value={a.pickupIncluded ? "yes" : "no"} onChange={(e) => update(i, { pickupIncluded: e.target.value === "yes" })}>
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </Field>
            <Field label="Pickup Time"><input type="time" className={inputCls} value={a.pickupTime} onChange={(e) => update(i, { pickupTime: e.target.value })} /></Field>
            <Field label="Pickup Location"><input className={inputCls} value={a.pickupLocation} onChange={(e) => update(i, { pickupLocation: e.target.value })} /></Field>
            <Field label="Meeting Point"><input className={inputCls} value={a.meetingPoint} onChange={(e) => update(i, { meetingPoint: e.target.value })} /></Field>
          </div>
          <Field label="Drop Location" className="mt-3"><input className={inputCls} value={a.dropLocation} onChange={(e) => update(i, { dropLocation: e.target.value })} /></Field>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <Field label="Inclusions"><textarea className={textareaCls} value={a.inclusions} onChange={(e) => update(i, { inclusions: e.target.value })} /></Field>
            <Field label="Exclusions"><textarea className={textareaCls} value={a.exclusions} onChange={(e) => update(i, { exclusions: e.target.value })} /></Field>
          </div>
          <Field label="Supplier" className="mt-3"><input className={inputCls} value={a.supplier} onChange={(e) => update(i, { supplier: e.target.value })} /></Field>
          <div className="mt-3">
            <DocumentUpload label="Activity Voucher" value={a.voucherUrl ?? ""} onChange={(url) => update(i, { voucherUrl: url || null })} />
          </div>
        </div>
      ))}
      {activities.length === 0 && <p className="text-center py-8 text-sm text-slate-500">No activities yet. Click &quot;Add Activity&quot; to begin.</p>}
    </div>
  );
}
