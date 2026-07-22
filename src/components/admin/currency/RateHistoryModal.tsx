"use client";

import { useEffect, useState } from "react";
import Drawer from "@/components/admin/ui/Drawer";
import { currenciesApi } from "@/lib/adminApi";
import type { AdminCurrencyRateHistory } from "@/types/admin";

interface RateHistoryModalProps {
  currencyId: string | null;
  currencyCode?: string;
  onClose: () => void;
}

export default function RateHistoryModal({ currencyId, currencyCode, onClose }: RateHistoryModalProps) {
  const [rows, setRows] = useState<AdminCurrencyRateHistory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currencyId) return;
    setLoading(true);
    currenciesApi.history(currencyId).then((res) => {
      if (res.success) setRows(res.data);
      setLoading(false);
    });
  }, [currencyId]);

  return (
    <Drawer
      open={!!currencyId}
      title={`Rate History${currencyCode ? ` — ${currencyCode}` : ""}`}
      onClose={onClose}
      footer={
        <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100">
          Close
        </button>
      }
    >
      {loading ? (
        <div className="text-center text-sm text-slate-500 py-10">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="text-center text-sm text-slate-500 py-10">No rate changes recorded yet.</div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-semibold text-slate-500 uppercase border-b border-slate-100">
              <th className="py-2">Old Rate</th>
              <th className="py-2">New Rate</th>
              <th className="py-2">Effective From</th>
              <th className="py-2">Changed By</th>
              <th className="py-2">Changed Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-slate-50">
                <td className="py-2 text-slate-500">{r.oldRate ?? "—"}</td>
                <td className="py-2 font-semibold text-slate-900">{r.newRate}</td>
                <td className="py-2">{new Date(r.effectiveFrom).toLocaleDateString("en-IN")}</td>
                <td className="py-2">{r.changedBy ?? "—"}</td>
                <td className="py-2 text-slate-500">{new Date(r.changedDate).toLocaleString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Drawer>
  );
}
