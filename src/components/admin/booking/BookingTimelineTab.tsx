"use client";

import type { AdminBookingTimelineEvent } from "@/types/admin";

interface Props {
  events: AdminBookingTimelineEvent[];
}

export default function BookingTimelineTab({ events }: Props) {
  if (events.length === 0) {
    return <p className="text-center py-8 text-sm text-slate-500">No activity recorded yet.</p>;
  }

  return (
    <div className="space-y-0">
      {events.map((e, i) => (
        <div key={e.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
            {i < events.length - 1 && <span className="w-px flex-1 bg-slate-200" />}
          </div>
          <div className="pb-5">
            <p className="text-sm text-slate-800">{e.message}</p>
            <p className="text-xs text-slate-400 mt-0.5">{new Date(e.createdDate).toLocaleString("en-IN")}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
