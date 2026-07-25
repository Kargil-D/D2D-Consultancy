"use client";

import type { ReactNode } from "react";
import { inputCls } from "@/components/admin/ui/Field";
import type { PaymentMode } from "@/types/admin";

/** Shared compact grid-cell styling for the Hotels/Activities/Transfers booking editors, so the three tabs render as one consistent grid system. */
export const PAYMENT_MODES: PaymentMode[] = ["Cash", "BankTransfer", "Card", "UPI", "Cheque", "Other"];

export const formatINR = (v: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", currencyDisplay: "code", maximumFractionDigits: 0 }).format(v);

export const cellInputCls = `${inputCls} text-sm`;
export const readonlyBoxCls = `${cellInputCls} bg-slate-50 flex items-center`;

const labelCls = "block text-[11px] font-semibold text-slate-500 uppercase mb-1";

export function GridField({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div className={className}>
      <span className={labelCls}>{label}</span>
      {children}
    </div>
  );
}
