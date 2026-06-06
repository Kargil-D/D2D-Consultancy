"use client";

import type { ReactNode } from "react";

interface FieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}

export function Field({
  label,
  required,
  hint,
  error,
  children,
  className = "",
}: FieldProps) {
  return (
    <label className={`block ${className}`}>
      <span className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label} {required && <span className="text-rose-500">*</span>}
      </span>
      {children}
      {hint && !error && <span className="block mt-1 text-xs text-slate-400">{hint}</span>}
      {error && <span className="block mt-1 text-xs text-rose-600">{error}</span>}
    </label>
  );
}

export const inputCls =
  "w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50";

export const textareaCls = `${inputCls} min-h-[90px] resize-y`;

export const selectCls = inputCls;
