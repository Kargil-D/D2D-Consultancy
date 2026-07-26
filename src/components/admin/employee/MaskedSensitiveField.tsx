"use client";

import { useState } from "react";
import { Eye, EyeOff, Pencil, X } from "lucide-react";
import { inputCls } from "@/components/admin/ui/Field";
import { employeesApi } from "@/lib/adminApi";

interface Props {
  employeeId?: string;
  field: "aadhaarNumber" | "accountNumber";
  maskedValue: string;
  pendingValue: string | undefined;
  onPendingChange: (v: string | undefined) => void;
  placeholder?: string;
}

/**
 * Aadhaar/bank account number editor. Never receives the decrypted value except via an
 * explicit "Reveal" click (Admin-only server call, audit-logged on every reveal — see
 * /api/admin/employees/[id]/reveal). Editing always starts from a blank input rather than
 * a pre-filled decrypted value, so a new value fully replaces the encrypted one on save.
 */
export default function MaskedSensitiveField({ employeeId, field, maskedValue, pendingValue, onPendingChange, placeholder }: Props) {
  const [revealed, setRevealed] = useState<string | null>(null);
  const [revealing, setRevealing] = useState(false);

  const reveal = async () => {
    if (!employeeId) return;
    setRevealing(true);
    try {
      const res = await employeesApi.reveal(employeeId, field);
      if (res.success) setRevealed(res.data.value);
    } finally {
      setRevealing(false);
    }
  };

  if (pendingValue !== undefined) {
    return (
      <div className="flex items-center gap-2">
        <input
          className={inputCls}
          value={pendingValue}
          placeholder={placeholder}
          onChange={(e) => onPendingChange(e.target.value)}
          autoFocus
        />
        <button
          type="button"
          onClick={() => onPendingChange(undefined)}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 flex-shrink-0"
          aria-label="Cancel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  if (!maskedValue) {
    return (
      <button
        type="button"
        onClick={() => onPendingChange("")}
        className="w-full text-left px-3 py-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-400 hover:border-blue-400 hover:text-blue-600"
      >
        + Add {placeholder ?? "value"}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 text-sm font-mono tracking-wide text-slate-700">
        {revealed ?? maskedValue}
      </div>
      <button
        type="button"
        onClick={() => (revealed ? setRevealed(null) : reveal())}
        disabled={!employeeId || revealing}
        className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40 flex-shrink-0"
        aria-label={revealed ? "Hide" : "Reveal"}
        title={employeeId ? (revealed ? "Hide" : "Reveal (audit-logged)") : "Save the employee first"}
      >
        {revealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
      <button
        type="button"
        onClick={() => {
          setRevealed(null);
          onPendingChange("");
        }}
        className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 flex-shrink-0"
        aria-label="Change"
        title="Replace with a new value"
      >
        <Pencil className="w-4 h-4" />
      </button>
    </div>
  );
}
