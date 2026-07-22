"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Plus, Trash2, Search, BedDouble, MapPin, Globe } from "lucide-react";
import { Field, inputCls, selectCls } from "@/components/admin/ui/Field";
import { hotelMasterApi } from "@/lib/adminApi";
import type { AdminHotelMaster, QuotationHotelOptionGroup, QuotationHotelOptionLabel, QuotationHotelSelection } from "@/types/admin";

const OPTION_LABELS: QuotationHotelOptionLabel[] = ["Option A", "Option B", "Option C"];

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const selectionFromMaster = (hotel: AdminHotelMaster): QuotationHotelSelection => ({
  id: newId(),
  hotelMasterId: hotel.id,
  hotelName: hotel.name,
  images: hotel.images,
  description: hotel.description,
  category: hotel.category,
  roomType: hotel.roomTypes[0] ?? "",
  mealPlan: hotel.mealPlans[0] ?? "",
  amenities: hotel.amenities,
  googleMapUrl: hotel.googleMapUrl,
  website: hotel.website,
  checkIn: "",
  checkOut: "",
  rooms: 1,
  nights: 1,
});

interface QuotationHotelOptionsEditorProps {
  options: QuotationHotelOptionGroup[];
  onChange: (options: QuotationHotelOptionGroup[]) => void;
}

export default function QuotationHotelOptionsEditor({ options, onChange }: QuotationHotelOptionsEditorProps) {
  const [catalog, setCatalog] = useState<AdminHotelMaster[]>([]);
  const [activeTab, setActiveTab] = useState<QuotationHotelOptionLabel>("Option A");
  const [search, setSearch] = useState("");

  useEffect(() => {
    hotelMasterApi.all().then((res) => {
      if (res.success) setCatalog(res.data);
    });
  }, []);

  const group = options.find((g) => g.label === activeTab);
  const results = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.trim().toLowerCase();
    return catalog.filter((h) => h.name.toLowerCase().includes(q)).slice(0, 8);
  }, [catalog, search]);

  const ensureGroup = (label: QuotationHotelOptionLabel): QuotationHotelOptionGroup[] => {
    if (options.some((g) => g.label === label)) return options;
    return [...options, { id: newId(), label, hotels: [] }];
  };

  const addHotel = (hotel: AdminHotelMaster) => {
    const withGroup = ensureGroup(activeTab);
    onChange(
      withGroup.map((g) => (g.label === activeTab ? { ...g, hotels: [...g.hotels, selectionFromMaster(hotel)] } : g)),
    );
    setSearch("");
  };

  const updateHotel = (hotelId: string, patch: Partial<QuotationHotelSelection>) => {
    onChange(
      options.map((g) =>
        g.label === activeTab
          ? { ...g, hotels: g.hotels.map((h) => (h.id === hotelId ? { ...h, ...patch } : h)) }
          : g,
      ),
    );
  };

  const removeHotel = (hotelId: string) => {
    onChange(options.map((g) => (g.label === activeTab ? { ...g, hotels: g.hotels.filter((h) => h.id !== hotelId) } : g)));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 border-b border-slate-200">
        {OPTION_LABELS.map((label) => {
          const count = options.find((g) => g.label === label)?.hotels.length ?? 0;
          return (
            <button
              key={label}
              type="button"
              onClick={() => setActiveTab(label)}
              className={`px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 -mb-px transition-colors ${
                activeTab === label ? "border-blue-600 text-blue-700 bg-blue-50" : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {label} {count > 0 && <span className="ml-1 text-xs text-slate-400">({count})</span>}
            </button>
          );
        })}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          className={`${inputCls} pl-9`}
          placeholder="Search Hotel Master by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {results.length > 0 && (
          <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg max-h-64 overflow-y-auto">
            {results.map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => addHotel(h)}
                className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-slate-50 border-b border-slate-50 last:border-0"
              >
                <div className="relative w-9 h-9 rounded-md bg-slate-100 overflow-hidden shrink-0">
                  {h.images[0] && <Image src={h.images[0]} alt={h.name} fill sizes="36px" className="object-cover" unoptimized />}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">{h.name}</div>
                  <div className="text-xs text-slate-500">{h.category || h.destination?.name || "—"}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {(group?.hotels ?? []).map((h) => (
        <div key={h.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BedDouble className="w-4 h-4 text-slate-400" />
              <span className="font-bold text-slate-900">{h.hotelName || "Hotel"}</span>
            </div>
            <button type="button" onClick={() => removeHotel(h.id)} className="p-1.5 rounded text-rose-600 hover:bg-rose-50"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>

          {h.images.length > 0 && (
            <div className="flex gap-2 mb-3">
              {h.images.slice(0, 4).map((url, i) => (
                <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                  <Image src={url} alt={`${h.hotelName}-${i}`} fill sizes="64px" className="object-cover" unoptimized />
                </div>
              ))}
            </div>
          )}

          {h.description && <p className="text-xs text-slate-500 mb-3">{h.description}</p>}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Field label="Check-in">
              <input type="date" className={inputCls} value={h.checkIn} onChange={(e) => updateHotel(h.id, { checkIn: e.target.value })} />
            </Field>
            <Field label="Check-out">
              <input type="date" className={inputCls} value={h.checkOut} onChange={(e) => updateHotel(h.id, { checkOut: e.target.value })} />
            </Field>
            <Field label="Rooms">
              <input type="number" min={1} className={inputCls} value={h.rooms} onChange={(e) => updateHotel(h.id, { rooms: Number(e.target.value) || 1 })} />
            </Field>
            <Field label="Nights">
              <input type="number" min={0} className={inputCls} value={h.nights} onChange={(e) => updateHotel(h.id, { nights: Number(e.target.value) || 0 })} />
            </Field>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <Field label="Room Type">
              {(catalog.find((c) => c.id === h.hotelMasterId)?.roomTypes.length ?? 0) > 0 ? (
                <select className={selectCls} value={h.roomType} onChange={(e) => updateHotel(h.id, { roomType: e.target.value })}>
                  {catalog.find((c) => c.id === h.hotelMasterId)!.roomTypes.map((rt) => (
                    <option key={rt} value={rt}>{rt}</option>
                  ))}
                </select>
              ) : (
                <input className={inputCls} value={h.roomType} onChange={(e) => updateHotel(h.id, { roomType: e.target.value })} placeholder="Deluxe Room" />
              )}
            </Field>
            <Field label="Meal Plan">
              {(catalog.find((c) => c.id === h.hotelMasterId)?.mealPlans.length ?? 0) > 0 ? (
                <select className={selectCls} value={h.mealPlan} onChange={(e) => updateHotel(h.id, { mealPlan: e.target.value })}>
                  {catalog.find((c) => c.id === h.hotelMasterId)!.mealPlans.map((mp) => (
                    <option key={mp} value={mp}>{mp}</option>
                  ))}
                </select>
              ) : (
                <input className={inputCls} value={h.mealPlan} onChange={(e) => updateHotel(h.id, { mealPlan: e.target.value })} placeholder="Breakfast Included" />
              )}
            </Field>
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
            {h.googleMapUrl && (
              <a href={h.googleMapUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-blue-700">
                <MapPin className="w-3.5 h-3.5" /> Map
              </a>
            )}
            {h.website && (
              <a href={h.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-blue-700">
                <Globe className="w-3.5 h-3.5" /> Website
              </a>
            )}
            {h.amenities.length > 0 && <span>{h.amenities.join(" · ")}</span>}
          </div>
        </div>
      ))}
      {(group?.hotels.length ?? 0) === 0 && (
        <p className="text-center py-8 text-sm text-slate-500 flex items-center justify-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Search Hotel Master above to add a hotel to {activeTab}.
        </p>
      )}
    </div>
  );
}
