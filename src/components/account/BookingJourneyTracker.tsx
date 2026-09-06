import { Check, X } from "lucide-react";
import type { BookingStatus } from "@/types/admin";

const FORWARD_STEPS: { status: BookingStatus; label: string }[] = [
  { status: "Booked", label: "Booked" },
  { status: "OnTrip", label: "On Trip" },
  { status: "Completed", label: "Completed" },
];

/** Read-only, customer-facing view of BookingStatusStepper's admin control — same step order, no click handlers. */
export default function BookingJourneyTracker({ status }: { status: BookingStatus }) {
  const isCancelled = status === "Cancelled";
  const currentIndex = isCancelled ? -1 : FORWARD_STEPS.findIndex((s) => s.status === status);

  if (isCancelled) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border bg-rose-50 border-rose-200 text-rose-700">
        <X className="w-3.5 h-3.5" /> This booking was cancelled
      </div>
    );
  }

  return (
    <div className="flex items-center flex-wrap gap-y-2">
      {FORWARD_STEPS.map((step, i) => {
        const isDone = i < currentIndex;
        const isCurrent = i === currentIndex;
        const isLast = i === FORWARD_STEPS.length - 1;

        return (
          <div key={step.status} className="flex items-center">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                isDone
                  ? "bg-emerald-600 border-emerald-600 text-white"
                  : isCurrent
                    ? "bg-cyan-600 border-cyan-600 text-white"
                    : "bg-white border-slate-200 text-slate-400"
              }`}
            >
              {isDone ? <Check className="w-3.5 h-3.5" /> : null}
              {step.label}
            </div>
            {!isLast && <div className={`w-6 sm:w-10 h-0.5 ${isDone ? "bg-emerald-500" : "bg-slate-200"}`} />}
          </div>
        );
      })}
    </div>
  );
}
