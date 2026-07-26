"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { inputCls } from "@/components/admin/ui/Field";
import type { AdminBookingCostSheetEntry, CostSheetStatus } from "@/types/admin";

interface Props {
  entries: AdminBookingCostSheetEntry[];
  /** Selling Price mirrors D2D Cost (qty × cost from the linked Quotation) for services that have one — Flight/Visa/Insurance aren't in this map and keep a manually-entered Selling Price. */
  d2dCostBySourceId: Map<string, number>;
  onSave: (rows: { id: string; supplierName?: string; bookingCost?: number; settlementCost?: number; sellingPrice?: number; status?: CostSheetStatus; remarks?: string | null }[]) => Promise<void>;
}

const formatINR = (v: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", currencyDisplay: "code", maximumFractionDigits: 0 }).format(v);

export default function BookingCostSheet({ entries, d2dCostBySourceId, onSave }: Props) {
  const [rows, setRows] = useState(entries);
  const [saving, setSaving] = useState(false);

  // Entries are reconciled server-side (new services added, removed ones dropped) — keep local rows in sync with the latest booking data.
  useEffect(() => setRows(entries), [entries]);

  const update = (idx: number, patch: Partial<AdminBookingCostSheetEntry>) => {
    setRows((r) => r.map((row, i) => (i === idx ? { ...row, ...patch, profit: (patch.sellingPrice ?? row.sellingPrice) - (patch.bookingCost ?? row.bookingCost) } : row)));
  };

  const save = async () => {
    setSaving(true);
    try {
      await onSave(rows.map((r) => ({ id: r.id, supplierName: r.supplierName, bookingCost: r.bookingCost, settlementCost: r.settlementCost, sellingPrice: r.sellingPrice, status: r.status, remarks: r.remarks })));
    } finally {
      setSaving(false);
    }
  };

  const totals = rows.reduce(
    (acc, r) => ({ bookingCost: acc.bookingCost + r.bookingCost, settlementCost: acc.settlementCost + r.settlementCost, sellingPrice: acc.sellingPrice + r.sellingPrice, profit: acc.profit + r.profit }),
    { bookingCost: 0, settlementCost: 0, sellingPrice: 0, profit: 0 },
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">One row per service added in the tabs below — auto-synced, just fill in the cost figures. Profit is calculated automatically.</p>
        <button type="button" onClick={save} disabled={saving} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50">
          <Save className="w-3.5 h-3.5" /> Save Cost Sheet
        </button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-semibold text-slate-500 uppercase border-b border-slate-100">
              <th className="px-3 py-2">Service</th>
              <th className="px-3 py-2 w-36">Supplier</th>
              <th className="px-3 py-2 w-28">Booking Cost</th>
              <th className="px-3 py-2 w-28">Settlement</th>
              <th className="px-3 py-2 w-28">Selling Price</th>
              <th className="px-3 py-2 w-24 text-right">Profit</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} className="border-b border-slate-50">
                <td className="px-3 py-2 text-slate-700">
                  <span className="text-xs font-semibold text-slate-500">{r.serviceType}</span>
                  <div>{r.serviceName || "—"}</div>
                </td>
                <td className="px-3 py-2"><input className={inputCls} value={r.supplierName} onChange={(e) => update(i, { supplierName: e.target.value })} /></td>
                <td className="px-3 py-2"><input type="number" min={0} className={inputCls} value={r.bookingCost} onChange={(e) => update(i, { bookingCost: Number(e.target.value) || 0 })} /></td>
                <td className="px-3 py-2"><input type="number" min={0} className={inputCls} value={r.settlementCost} onChange={(e) => update(i, { settlementCost: Number(e.target.value) || 0 })} /></td>
                <td className="px-3 py-2">
                  {d2dCostBySourceId.has(r.sourceId) ? (
                    <div className={`${inputCls} bg-slate-50 text-slate-600 flex items-center`}>{formatINR(r.sellingPrice)}</div>
                  ) : (
                    <input type="number" min={0} className={inputCls} value={r.sellingPrice} onChange={(e) => update(i, { sellingPrice: Number(e.target.value) || 0 })} />
                  )}
                </td>
                <td className={`px-3 py-2 text-right font-semibold ${r.profit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{formatINR(r.profit)}</td>
              </tr>
            ))}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-slate-200 font-bold text-slate-900">
                <td className="px-3 py-2" colSpan={2}>Total</td>
                <td className="px-3 py-2">{formatINR(totals.bookingCost)}</td>
                <td className="px-3 py-2">{formatINR(totals.settlementCost)}</td>
                <td className="px-3 py-2">{formatINR(totals.sellingPrice)}</td>
                <td className={`px-3 py-2 text-right ${totals.profit >= 0 ? "text-emerald-700" : "text-rose-700"}`}>{formatINR(totals.profit)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      {rows.length === 0 && <p className="text-center py-8 text-sm text-slate-500">No cost sheet entries yet — add a Flight, Hotel, Activity, Transfer, Visa or Insurance to populate this automatically.</p>}
    </div>
  );
}
