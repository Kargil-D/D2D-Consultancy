"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Plus, Trash2, Copy, ArrowRightLeft } from "lucide-react";
import { Field, inputCls, selectCls } from "@/components/admin/ui/Field";
import DateInput from "@/components/admin/ui/DateInput";
import { useToast } from "@/components/admin/ui/Toast";
import { isWithinRange, dateRangeMessage } from "@/utils/dateRange";
import { transferTypesApi } from "@/lib/adminApi";
import type { AdminTransferType, QuotationTransferItem } from "@/types/admin";

export const newTransferItem = (): QuotationTransferItem => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  transferTypeId: null,
  name: "",
  description: "",
  images: [],
  pickupLocation: "",
  dropLocation: "",
  vehicleType: "",
  mode: "Private",
  transferDate: "",
  duration: "",
  pickupTime: "",
  dropTime: "",
  status: "Included",
  notes: "",
});

interface QuotationTransfersEditorProps {
  transfers: QuotationTransferItem[];
  onChange: (transfers: QuotationTransferItem[]) => void;
  /** Trip's travel start/end dates (YYYY-MM-DD) — each transfer date must fall within this range. */
  minDate?: string;
  maxDate?: string;
}

type CatalogState = "loading" | "loaded" | "error";

export default function QuotationTransfersEditor({ transfers, onChange, minDate, maxDate }: QuotationTransfersEditorProps) {
  const { notify } = useToast();
  const [catalog, setCatalog] = useState<AdminTransferType[]>([]);
  const [catalogState, setCatalogState] = useState<CatalogState>("loading");

  useEffect(() => {
    let cancelled = false;
    setCatalogState("loading");

    transferTypesApi
      .list({ pageSize: 1000 })
      .then((res) => {
        if (cancelled) return;
        if (!res.success) {
          setCatalogState("error");
          return;
        }
        setCatalog(res.data.items.filter((t) => t.status === "Active"));
        setCatalogState("loaded");
      })
      .catch(() => {
        if (!cancelled) setCatalogState("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const update = (idx: number, patch: Partial<QuotationTransferItem>) => {
    const next = [...transfers];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };

  /** Selecting a Transfer Type loads its image from Transfer Type Master. */
  const selectTransferType = (idx: number, transferTypeId: string) => {
    if (!transferTypeId) {
      update(idx, { transferTypeId: null, vehicleType: "", images: [] });
      return;
    }
    const master = catalog.find((t) => t.id === transferTypeId);
    if (!master) return;
    update(idx, {
      transferTypeId: master.id,
      vehicleType: master.name,
      images: master.imageUrl ? [master.imageUrl] : [],
    });
  };

  /** Rejects a transfer date outside the trip's travel dates instead of applying it. */
  const updateDate = (idx: number, value: string) => {
    if (!isWithinRange(value, minDate, maxDate)) {
      notify(dateRangeMessage(minDate, maxDate), "error");
      return;
    }
    update(idx, { transferDate: value });
  };
  const add = () => onChange([...transfers, newTransferItem()]);
  const duplicate = (idx: number) => {
    const copy = { ...transfers[idx], id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` };
    onChange([...transfers.slice(0, idx + 1), copy, ...transfers.slice(idx + 1)]);
  };
  const remove = (idx: number) => onChange(transfers.filter((_, i) => i !== idx));

  const dropdownDisabled = catalogState === "loading" || catalogState === "error";
  const dropdownPlaceholder =
    catalogState === "loading"
      ? "Loading transfer types…"
      : catalogState === "error"
        ? "Unable to load transfer types"
        : catalog.length === 0
          ? "No transfer types available"
          : "Select a transfer type";

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-xs text-slate-500">e.g. Airport Transfer, Hotel Transfer, Intercity Transfer, Speed Boat Transfer, Private Cab.</p>
        <button type="button" onClick={add} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold">
          <Plus className="w-3.5 h-3.5" /> Add Transfer
        </button>
      </div>
      {transfers.map((t, i) => {
        const selectedNotInCatalog = !!t.transferTypeId && !catalog.some((c) => c.id === t.transferTypeId);
        return (
          <div key={t.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-slate-400" />
              <span className="font-bold text-slate-900">{t.name || `Transfer ${i + 1}`}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                  t.status === "Included" ? "bg-emerald-100 text-emerald-700" : t.status === "Optional" ? "bg-amber-100 text-amber-700" : "bg-slate-200 text-slate-600"
                }`}
              >
                {t.status}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => duplicate(i)} className="p-1.5 rounded text-slate-500 hover:bg-slate-200" aria-label="Duplicate transfer"><Copy className="w-3.5 h-3.5" /></button>
              <button type="button" onClick={() => remove(i)} className="p-1.5 rounded text-rose-600 hover:bg-rose-50" aria-label="Delete transfer"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Field label="Transfer Name">
              <input className={inputCls} value={t.name} onChange={(e) => update(i, { name: e.target.value })} placeholder="Airport Transfer" />
            </Field>
            <Field label="Transfer Type">
              <select
                className={selectCls}
                value={t.transferTypeId ?? ""}
                disabled={dropdownDisabled}
                onChange={(e) => selectTransferType(i, e.target.value)}
              >
                <option value="">{dropdownPlaceholder}</option>
                {selectedNotInCatalog && (
                  <option value={t.transferTypeId ?? ""}>{t.vehicleType || "Selected type"} (unavailable)</option>
                )}
                {catalog.map((type) => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Private / SIC">
              <select className={selectCls} value={t.mode} onChange={(e) => update(i, { mode: e.target.value as "Private" | "SIC" })}>
                <option value="Private">Private</option>
                <option value="SIC">SIC</option>
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <Field label="Pickup Location">
              <input className={inputCls} value={t.pickupLocation} onChange={(e) => update(i, { pickupLocation: e.target.value })} placeholder="Airport" />
            </Field>
            <Field label="Drop Location">
              <input className={inputCls} value={t.dropLocation} onChange={(e) => update(i, { dropLocation: e.target.value })} placeholder="Hotel" />
            </Field>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
            <Field label="Transfer Date">
              <DateInput value={t.transferDate} min={minDate} max={maxDate} onChange={(iso) => updateDate(i, iso)} />
            </Field>
            <Field label="Duration">
              <input className={inputCls} value={t.duration} onChange={(e) => update(i, { duration: e.target.value })} placeholder="45 mins" />
            </Field>
            <Field label="Pickup Time">
              <input type="time" className={inputCls} value={t.pickupTime} onChange={(e) => update(i, { pickupTime: e.target.value })} />
            </Field>
            <Field label="Drop Time">
              <input type="time" className={inputCls} value={t.dropTime} onChange={(e) => update(i, { dropTime: e.target.value })} />
            </Field>
          </div>
          <Field label="Images" className="mt-3">
            {(t.images ?? []).length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {t.images.map((url, imgIdx) => (
                  <div key={imgIdx} className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                    <Image src={url} alt={`${t.name || "transfer"}-${imgIdx}`} fill sizes="120px" className="object-cover" unoptimized />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No images yet — select a transfer type above to load its image from Transfer Type Master.</p>
            )}
          </Field>
        </div>
        );
      })}
      {transfers.length === 0 && <p className="text-center py-8 text-sm text-slate-500">No transfers yet. Click &quot;Add Transfer&quot; to begin.</p>}
    </div>
  );
}
