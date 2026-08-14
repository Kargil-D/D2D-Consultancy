"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Plus, Trash2, BedDouble } from "lucide-react";
import { Field, selectCls, textareaCls } from "@/components/admin/ui/Field";
import { hotelMasterApi } from "@/lib/adminApi";
import type { AdminHotelMaster, HotelStayDetail } from "@/types/admin";

export const newHotelStay = (): HotelStayDetail => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  hotelMasterId: "",
  name: "",
  images: [],
  roomType: "",
  description: "",
});

interface HotelStaysEditorProps {
  hotels: HotelStayDetail[];
  /** Only Hotel Master entries for this destination are offered — a campaign only ever stays at hotels in its own destination. */
  destinationId?: string | null;
  onChange: (hotels: HotelStayDetail[]) => void;
}

export default function HotelStaysEditor({ hotels, destinationId, onChange }: HotelStaysEditorProps) {
  const [hotelMasters, setHotelMasters] = useState<AdminHotelMaster[]>([]);

  useEffect(() => {
    (async () => {
      const res = await hotelMasterApi.all();
      if (res.success) setHotelMasters(res.data);
    })();
  }, []);

  const options = destinationId ? hotelMasters.filter((hm) => hm.destinationId === destinationId) : hotelMasters;

  const update = (idx: number, patch: Partial<HotelStayDetail>) => {
    const next = [...hotels];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };
  const add = () => onChange([...hotels, newHotelStay()]);
  const remove = (idx: number) => onChange(hotels.filter((_, i) => i !== idx));

  const selectHotelMaster = (idx: number, hotelMasterId: string) => {
    const hm = hotelMasters.find((h) => h.id === hotelMasterId);
    update(idx, {
      hotelMasterId,
      name: hm?.name ?? "",
      images: hm?.images ?? [],
      roomType: "",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-xs text-slate-500">Add each hotel stay with its image, room type and description.</p>
        <button type="button" onClick={add} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold">
          <Plus className="w-3.5 h-3.5" /> Add Hotel
        </button>
      </div>
      {hotels.map((h, i) => {
        const selectedHotel = hotelMasters.find((hm) => hm.id === h.hotelMasterId);
        const roomOptions = selectedHotel?.roomTypes ?? [];
        const images = h.images ?? [];
        return (
          <div key={h.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BedDouble className="w-4 h-4 text-slate-400" />
                <span className="font-bold text-slate-900">Hotel {i + 1}</span>
              </div>
              <button type="button" onClick={() => remove(i)} className="p-1.5 rounded text-rose-600 hover:bg-rose-50"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Hotel Name" hint={options.length === 0 ? "No Hotel Master entries for this destination yet" : undefined}>
                <select className={selectCls} value={h.hotelMasterId ?? ""} onChange={(e) => selectHotelMaster(i, e.target.value)}>
                  <option value="">Select hotel</option>
                  {selectedHotel && !options.some((o) => o.id === selectedHotel.id) && (
                    <option value={selectedHotel.id}>{selectedHotel.name}</option>
                  )}
                  {options.map((hm) => (
                    <option key={hm.id} value={hm.id}>{hm.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Type of Room">
                <select
                  className={selectCls}
                  value={h.roomType}
                  onChange={(e) => update(i, { roomType: e.target.value })}
                  disabled={roomOptions.length === 0}
                >
                  <option value="">{roomOptions.length === 0 ? "Select a hotel first" : "Select room type"}</option>
                  {roomOptions.map((rt) => (
                    <option key={rt} value={rt}>{rt}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <Field label="Hotel Images" hint="From the Hotel Master catalog">
                {images.length > 0 ? (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {images.map((url, imgIdx) => (
                      <div
                        key={imgIdx}
                        className="relative w-1/2 flex-shrink-0 aspect-square rounded-lg overflow-hidden bg-slate-100 border border-slate-200"
                      >
                        <Image src={url} alt={`${h.name || "hotel"}-${imgIdx}`} fill sizes="200px" className="object-cover" unoptimized />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic px-1 py-2">Select a hotel above to show its images.</p>
                )}
              </Field>
              <Field label="Description">
                <textarea className={textareaCls} value={h.description} onChange={(e) => update(i, { description: e.target.value })} />
              </Field>
            </div>
          </div>
        );
      })}
      {hotels.length === 0 && <p className="text-center py-8 text-sm text-slate-500">No hotels yet. Click &quot;Add Hotel&quot; to begin.</p>}
    </div>
  );
}
