"use client";

import { useMemo } from "react";
import { Plus, Trash2, Copy, Users, Wand2, User, UserRound, UserCircle2, Phone, CalendarClock } from "lucide-react";
import { GridField as Field, cellInputCls } from "@/components/admin/booking/BookingGridField";
import type { AdminBookingPassenger, PassengerGender, PassengerType } from "@/types/admin";

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const newBookingPassenger = (paxType: PassengerType = "Adult"): AdminBookingPassenger => ({
  id: newId(),
  paxType,
  name: "",
  age: null,
  gender: "Other",
  contactNumber: "",
});

const PAX_TYPES: PassengerType[] = ["Adult", "Child", "Infant"];

const TYPE_STYLE: Record<PassengerType, { border: string; badge: string; ring: string }> = {
  Adult: { border: "border-l-blue-500", badge: "bg-blue-50 text-blue-700 border-blue-200", ring: "ring-blue-100" },
  Child: { border: "border-l-amber-500", badge: "bg-amber-50 text-amber-700 border-amber-200", ring: "ring-amber-100" },
  Infant: { border: "border-l-violet-500", badge: "bg-violet-50 text-violet-700 border-violet-200", ring: "ring-violet-100" },
};

const GENDER_OPTIONS: { value: PassengerGender; label: string; icon: typeof User }[] = [
  { value: "Male", label: "Male", icon: User },
  { value: "Female", label: "Female", icon: UserRound },
  { value: "Other", label: "Other", icon: UserCircle2 },
];

interface Props {
  passengers: AdminBookingPassenger[];
  onChange: (passengers: AdminBookingPassenger[]) => void;
  /** Trip's total traveller counts (from the Booking record) — drive the "Generate rows" action
   * and the completion progress bar, without ever silently deleting a row someone filled in. */
  adults: number;
  childrenCount: number;
  infants: number;
}

export default function BookingPassengersEditor({ passengers, onChange, adults, childrenCount, infants }: Props) {
  const expected: Record<PassengerType, number> = { Adult: adults, Child: childrenCount, Infant: infants };
  const expectedTotal = adults + childrenCount + infants;

  const countsByType = useMemo(() => {
    const counts: Record<PassengerType, number> = { Adult: 0, Child: 0, Infant: 0 };
    for (const p of passengers) counts[p.paxType]++;
    return counts;
  }, [passengers]);

  const typeOrdinal = useMemo(() => {
    const seen: Record<PassengerType, number> = { Adult: 0, Child: 0, Infant: 0 };
    return passengers.map((p) => ++seen[p.paxType]);
  }, [passengers]);

  const filledCount = passengers.filter((p) => p.name.trim().length > 0).length;
  const progressPct = passengers.length > 0 ? Math.round((filledCount / passengers.length) * 100) : 0;
  const missingByType = PAX_TYPES.filter((t) => countsByType[t] < expected[t]);

  const update = (idx: number, patch: Partial<AdminBookingPassenger>) => {
    const next = [...passengers];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };
  const add = (paxType: PassengerType = "Adult") => onChange([...passengers, newBookingPassenger(paxType)]);
  const duplicate = (idx: number) => {
    const copy = { ...passengers[idx], id: newId() };
    onChange([...passengers.slice(0, idx + 1), copy, ...passengers.slice(idx + 1)]);
  };
  const remove = (idx: number) => onChange(passengers.filter((_, i) => i !== idx));

  /** Tops up rows for whichever pax type(s) are short of the booking's traveller counts —
   * never removes or reorders existing rows, so filled-in data is always safe. */
  const generateMissingRows = () => {
    const additions: AdminBookingPassenger[] = [];
    for (const type of PAX_TYPES) {
      const shortfall = expected[type] - countsByType[type];
      for (let i = 0; i < shortfall; i++) additions.push(newBookingPassenger(type));
    }
    if (additions.length > 0) onChange([...passengers, ...additions]);
  };

  return (
    <div className="space-y-4">
      {/* Summary / progress header */}
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-slate-900 text-white shrink-0">
              <Users className="w-4 h-4" />
            </span>
            <div>
              <div className="text-sm font-bold text-slate-900">Co-Passenger Details</div>
              <div className="text-xs text-slate-500">
                {adults} Adult{adults === 1 ? "" : "s"}
                {childrenCount > 0 && `, ${childrenCount} Child${childrenCount === 1 ? "" : "ren"}`}
                {infants > 0 && `, ${infants} Infant${infants === 1 ? "" : "s"}`} · {expectedTotal} traveller{expectedTotal === 1 ? "" : "s"} total
              </div>
            </div>
          </div>

          {missingByType.length > 0 && (
            <button
              type="button"
              onClick={generateMissingRows}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Wand2 className="w-3.5 h-3.5" />
              Add {missingByType.map((t) => `${expected[t] - countsByType[t]} ${t}`).join(", ")}
            </button>
          )}
        </div>

        {passengers.length > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1">
              <span>Details captured</span>
              <span>{filledCount} / {passengers.length}</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        {PAX_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => add(t)}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors hover:brightness-95 ${TYPE_STYLE[t].badge}`}
          >
            <Plus className="w-3.5 h-3.5" /> {t}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {passengers.map((p, i) => {
          const style = TYPE_STYLE[p.paxType];
          const GenderIcon = GENDER_OPTIONS.find((g) => g.value === p.gender)?.icon ?? UserRound;
          return (
            <div key={p.id ?? i} className={`rounded-xl border border-slate-200 border-l-4 ${style.border} bg-white p-4 shadow-sm`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <span className={`inline-flex items-center justify-center w-9 h-9 rounded-full ring-4 ${style.ring} bg-white border border-slate-200 text-slate-500`}>
                    <GenderIcon className="w-4 h-4" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{p.name || `${p.paxType} ${typeOrdinal[i]}`}</span>
                      <select
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border cursor-pointer ${style.badge}`}
                        value={p.paxType}
                        onChange={(e) => update(i, { paxType: e.target.value as PassengerType })}
                      >
                        {PAX_TYPES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => duplicate(i)} className="p-1.5 rounded text-slate-500 hover:bg-slate-100" aria-label="Duplicate passenger"><Copy className="w-3.5 h-3.5" /></button>
                  <button type="button" onClick={() => remove(i)} className="p-1.5 rounded text-rose-600 hover:bg-rose-50" aria-label="Remove passenger"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <Field label="Full Name" className="lg:col-span-2">
                  <input className={cellInputCls} value={p.name} onChange={(e) => update(i, { name: e.target.value })} placeholder="As per ID proof" />
                </Field>
                <Field label="Age">
                  <div className="relative">
                    <CalendarClock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="number"
                      min={0}
                      max={120}
                      className={`${cellInputCls} pl-8`}
                      value={p.age ?? ""}
                      onChange={(e) => update(i, { age: e.target.value === "" ? null : Number(e.target.value) })}
                    />
                  </div>
                </Field>
                <Field label="Contact Number">
                  <div className="relative">
                    <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="tel"
                      className={`${cellInputCls} pl-8`}
                      value={p.contactNumber}
                      onChange={(e) => update(i, { contactNumber: e.target.value })}
                      placeholder="+91…"
                    />
                  </div>
                </Field>
              </div>

              <div className="mt-3">
                <span className="block text-[11px] font-semibold text-slate-500 uppercase mb-1.5">Gender</span>
                <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden">
                  {GENDER_OPTIONS.map(({ value, label, icon: Icon }, gi) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => update(i, { gender: value })}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors ${
                        gi > 0 ? "border-l border-slate-200" : ""
                      } ${p.gender === value ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
                    >
                      <Icon className="w-3.5 h-3.5" /> {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {passengers.length === 0 && (
        <div className="text-center py-10 rounded-xl border border-dashed border-slate-300">
          <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500 mb-3">No co-passengers added yet.</p>
          {expectedTotal > 0 && (
            <button
              type="button"
              onClick={generateMissingRows}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              <Wand2 className="w-4 h-4" /> Generate {expectedTotal} passenger row{expectedTotal === 1 ? "" : "s"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
