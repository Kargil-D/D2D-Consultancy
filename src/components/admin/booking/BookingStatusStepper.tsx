"use client";

import { Check } from "lucide-react";
import type { BookingStatus } from "@/types/admin";

const STEPS: { status: BookingStatus; label: string }[] = [
  { status: "Assigned", label: "Assigned" },
  { status: "DmcSent", label: "DMC Sent" },
  { status: "AwaitingConfirmation", label: "Awaiting Confirmation" },
  { status: "Confirmed", label: "Confirmed" },
  { status: "VoucherGenerated", label: "Voucher" },
  { status: "Booked", label: "Booked" },
];

interface BookingStatusStepperProps {
  status: BookingStatus;
  onChange: (status: BookingStatus) => void;
  disabled?: boolean;
}

export default function BookingStatusStepper({ status, onChange, disabled }: BookingStatusStepperProps) {
  const currentIndex = STEPS.findIndex((s) => s.status === status);

  return (
    <div className="flex items-center overflow-x-auto">
      {STEPS.map((step, i) => {
        const isDone = i < currentIndex;
        const isCurrent = i === currentIndex;
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
