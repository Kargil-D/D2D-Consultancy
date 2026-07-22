"use client";

import { Check, X } from "lucide-react";
import type { BookingStatus } from "@/types/admin";

// "Cancelled" is a terminal exit state, not a step in the forward pipeline —
// rendered as a separate toggle so cancelling a booking never falsely marks
// earlier steps as "done" when they were never actually reached.
const FORWARD_STEPS: { status: BookingStatus; label: string }[] = [
  { status: "Won", label: "Won" },
  { status: "Booked", label: "Booked" },
  { status: "OnTrip", label: "On Trip" },
  { status: "Completed", label: "Completed" },
];

interface BookingStatusStepperProps {
  status: BookingStatus;
  onChange: (status: BookingStatus) => void;
  disabled?: boolean;
}

export default function BookingStatusStepper({ status, onChange, disabled }: BookingStatusStepperProps) {
  const isCancelled = status === "Cancelled";
  const currentIndex = isCancelled ? -1 : FORWARD_STEPS.findIndex((s) => s.status === status);

  return (
    <div className="flex items-center gap-3 overflow-x-auto">
      <div className="flex items-center flex-shrink-0">
        {FORWARD_STEPS.map((step, i) => {
          const isDone = !isCancelled && i < currentIndex;
          const isCurrent = !isCancelled && i === currentIndex;
          const isLast = i === FORWARD_STEPS.length - 1;

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

      <div className="w-px h-5 bg-slate-200 flex-shrink-0" />

      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange("Cancelled")}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors disabled:cursor-not-allowed flex-shrink-0 ${
          isCancelled
            ? "bg-rose-600 border-rose-600 text-white"
            : "bg-white border-slate-200 text-slate-500 hover:border-rose-300"
        }`}
      >
        {isCancelled ? <X className="w-3.5 h-3.5" /> : null}
        Cancelled
      </button>
    </div>
  );
}
