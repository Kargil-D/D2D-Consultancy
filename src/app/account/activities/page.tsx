"use client";

import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import type { AdminBooking, BookingStatus } from "@/types/admin";

const STATUS_STYLES: Partial<Record<BookingStatus, string>> = {
  Confirmed: "bg-cyan-50 text-cyan-700 border-cyan-200",
  VoucherGenerated: "bg-blue-50 text-blue-700 border-blue-200",
  Booked: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export default function YourActivitiesPage() {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<{ bookings: AdminBooking[] }>("/api/customer/activities")
      .then((data) => setBookings(data.bookings))
      .catch((e) => setError(e instanceof Error ? e.message : "Unable to load your activities"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Your Activities</h1>
      <p className="text-sm text-slate-500 mb-6">Your confirmed bookings.</p>

      {loading ? (
        <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center text-sm text-slate-500">Loading…</div>
      ) : error ? (
        <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center text-sm text-rose-600">{error}</div>
      ) : bookings.length === 0 ? (
        <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center">
          <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No confirmed bookings yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {bookings.map((b) => (
            <div key={b.id} className="rounded-2xl bg-white border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-slate-900">{b.destination?.name ?? "Destination"}</h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_STYLES[b.status] ?? "bg-slate-100 text-slate-700 border-slate-200"}`}>
                  {b.status}
                </span>
              </div>
              <p className="text-sm text-slate-500">
                {b.travelDate ? new Date(b.travelDate).toLocaleDateString("en-IN") : "Travel date not set"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
