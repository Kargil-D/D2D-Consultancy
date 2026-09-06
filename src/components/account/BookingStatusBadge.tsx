import type { BookingStatus } from "@/types/admin";

const STATUS_STYLES: Record<BookingStatus, string> = {
  Won: "bg-slate-100 text-slate-700 border-slate-200",
  Booked: "bg-cyan-50 text-cyan-700 border-cyan-200",
  OnTrip: "bg-amber-50 text-amber-700 border-amber-200",
  Completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Cancelled: "bg-rose-50 text-rose-700 border-rose-200",
};

const STATUS_LABELS: Record<BookingStatus, string> = {
  Won: "Won",
  Booked: "Booked",
  OnTrip: "On Trip",
  Completed: "Completed",
  Cancelled: "Cancelled",
};

export default function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
