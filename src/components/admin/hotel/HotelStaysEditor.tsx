"use client";

import Image from "next/image";
import { Plus, Trash2, BedDouble, X } from "lucide-react";
import ImageUpload from "@/components/admin/ui/ImageUpload";
import { Field, inputCls, textareaCls } from "@/components/admin/ui/Field";
import type { HotelStayDetail } from "@/types/admin";

export const newHotelStay = (): HotelStayDetail => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  name: "",
  images: [],
  roomType: "",
  description: "",
});

interface HotelStaysEditorProps {
  hotels: HotelStayDetail[];
  onChange: (hotels: HotelStayDetail[]) => void;
}

export default function HotelStaysEditor({ hotels, onChange }: HotelStaysEditorProps) {
  const update = (idx: number, patch: Partial<HotelStayDetail>) => {
    const next = [...hotels];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };
  const add = () => onChange([...hotels, newHotelStay()]);
  const remove = (idx: number) => onChange(hotels.filter((_, i) => i !== idx));

  const addImage = (idx: number, url: string) => {
    if (!url) return;
    update(idx, { images: [...(hotels[idx].images ?? []), url] });
  };
  const removeImage = (idx: number, imgIdx: number) => {
    update(idx, { images: (hotels[idx].images ?? []).filter((_, j) => j !== imgIdx) });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-xs text-slate-500">Add each hotel stay with its image, room type and description.</p>
        <button type="button" onClick={add} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold">
          <Plus className="w-3.5 h-3.5" /> Add Hotel
        </button>
      </div>
      {hotels.map((h, i) => (
        <div key={h.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BedDouble className="w-4 h-4 text-slate-400" />
              <span className="font-bold text-slate-900">Hotel {i + 1}</span>
            </div>
            <button type="button" onClick={() => remove(i)} className="p-1.5 rounded text-rose-600 hover:bg-rose-50"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Hotel Name">
              <input className={inputCls} value={h.name} onChange={(e) => update(i, { name: e.target.value })} />
            </Field>
            <Field label="Type of Room">
              <input className={inputCls} value={h.roomType} onChange={(e) => update(i, { roomType: e.target.value })} placeholder="Deluxe Room" />
            </Field>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <Field label="Hotel Images">
              <div className="grid grid-cols-3 gap-2">
                {(h.images ?? []).map((url, imgIdx) => (
                  <div key={imgIdx} className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                    <Image src={url} alt={`${h.name || "hotel"}-${imgIdx}`} fill sizes="120px" className="object-cover" unoptimized />
                    <button
                      type="button"
                      onClick={() => removeImage(i, imgIdx)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white/90 text-rose-600 flex items-center justify-center shadow"
                      aria-label="Remove image"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <div className="aspect-square">
                  <ImageUpload value="" onChange={(url) => addImage(i, url)} label="Add" aspect="square" />
                </div>
              </div>
            </Field>
            <Field label="Description">
              <textarea className={textareaCls} value={h.description} onChange={(e) => update(i, { description: e.target.value })} />
            </Field>
          </div>
        </div>
      ))}
      {hotels.length === 0 && <p className="text-center py-8 text-sm text-slate-500">No hotels yet. Click &quot;Add Hotel&quot; to begin.</p>}
    </div>
  );
}
