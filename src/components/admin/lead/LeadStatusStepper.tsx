"use client";

import { Check } from "lucide-react";
import type { LeadStatus } from "@/types/admin";

const STEPS: { status: LeadStatus; label: string }[] = [
  { status: "New", label: "New" },
  { status: "Contacted", label: "Contacted" },
  { status: "FollowUp", label: "Follow Up" },
  { status: "QuotationSent", label: "Quotation Sent" },
  { status: "PaymentPending", label: "Payment Pending" },
  { status: "Won", label: "Won" },
];

interface LeadStatusStepperProps {
  status: LeadStatus;
  onChange: (status: LeadStatus) => void;
  disabled?: boolean;
}

export default function LeadStatusStepper({ status, onChange, disabled }: LeadStatusStepperProps) {
  const currentIndex = status === "Lost" ? -1 : STEPS.findIndex((s) => s.status === status);

  return (
    <div className="flex items-center overflow-x-auto">
      {STEPS.map((step, i) => {
        const isDone = i < currentIndex || status === "Won";
        const isCurrent = i === currentIndex && status !== "Won";
        const isLast = i === STEPS.length - 1;

        return (
          <div key={step.status} className="flex items-center flex-shrink-0">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange(step.status)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors disabled:cursor-not-allowed ${
                isDone
                  ? "bg-emerald-600 border-emerald-600 text-white"
                  : isCurrent
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "bg-white border-slate-200 text-slate-500 hover:border-blue-300"
              }`}
            >
              {isDone ? <Check className="w-3.5 h-3.5" /> : null}
              {step.label}
            </button>
            {!isLast && <div className={`w-6 h-0.5 flex-shrink-0 ${isDone ? "bg-emerald-500" : "bg-slate-200"}`} />}
          </div>
        );
      })}
    </div>
  );
}
