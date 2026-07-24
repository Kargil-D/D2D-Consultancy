"use client";

import { useEffect, useState } from "react";
import { IndianRupee } from "lucide-react";
import { inputCls } from "@/components/admin/ui/Field";
import type { AdminBookingCostSheetEntry } from "@/types/admin";

interface Props {
  sourceId: string;
  costSheet: AdminBookingCostSheetEntry[];
  onChange: (sourceId: string, bookingCost: number) => void;
}

/**
 * Booked Cost lives on the Cost Sheet (one entry per service row, auto-reconciled by
 * sourceId — see reconcileCostSheet in bookingService.ts), not as a separate column on
 * each service table. This just gives the Hotel/Activity/Transfer cards a quick inline
 * editor for that one field so Operations doesn't have to jump to the Cost Sheet tab for it.
 */
export default function BookedCostField({ sourceId, costSheet, onChange }: Props) {
  const entry = costSheet.find((e) => e.sourceId === sourceId);
  const [value, setValue] = useState(entry?.bookingCost ?? 0);

  useEffect(() => {
    if (entry) setValue(entry.bookingCost);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on the value, not the object: `entry` is a fresh reference every render (costSheet.find), depending on it would re-run this every render instead of only when bookingCost actually changes.
  }, [entry?.bookingCost]);

  if (!entry) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-400">
        Save this row first to set its Booked Cost (syncs to the Cost Sheet).
      </div>
    );
  }

  return (
    <label className="block">
      <span className="flex items-center gap-1 mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
        <IndianRupee className="w-3 h-3" /> Booked Cost
      </span>
      <input
        type="number"
        min={0}
        className={inputCls}
        value={value}
        onChange={(e) => setValue(Number(e.target.value) || 0)}
        onBlur={() => value !== entry.bookingCost && onChange(sourceId, value)}
      />
    </label>
  );
}
