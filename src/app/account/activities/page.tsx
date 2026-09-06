"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, ChevronRight } from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import BookingStatusBadge from "@/components/account/BookingStatusBadge";
import type { BookingStatus } from "@/types/admin";

interface ActivityBooking {
  id: string;
  status: BookingStatus;
  travelDate: string | null;
  totalAmount: number;
  destination?: { name: string };
  customerPayments: { amount: number }[];
}

const formatINR = (v: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", currencyDisplay: "code", maximumFractionDigits: 0 }).format(v);

export default function YourActivitiesPage() {
  const [bookings, setBookings] = useState<ActivityBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<{ bookings: ActivityBooking[] }>("/api/customer/activities")
      .then((data) => setBookings(data.bookings))
      .catch((e) => setError(e instanceof Error ? e.message : "Unable to load your activities"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Your Activities</h1>
      <p className="text-sm text-slate-500 mb-6">Your confirmed bookings — track status and payments.</p>

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
          {bookings.map((b) => {
            const paid = b.customerPayments.reduce((sum, p) => sum + p.amount, 0);
            const pct = b.totalAmount > 0 ? Math.min(100, Math.round((paid / b.totalAmount) * 100)) : 0;
            return (
              <Link
                key={b.id}
                href={`/account/bookings/${b.id}`}
                className="rounded-2xl bg-white border border-slate-200 p-5 hover:border-cyan-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-slate-900">{b.destination?.name ?? "Destination"}</h3>
                  <BookingStatusBadge status={b.status} />
                </div>
                <p className="text-sm text-slate-500 mb-3">
                  {b.travelDate ? new Date(b.travelDate).toLocaleDateString("en-IN") : "Travel date not set"}
                </p>

                {b.totalAmount > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span>Paid {formatINR(paid)} of {formatINR(b.totalAmount)}</span>
                      <span className="font-semibold text-slate-700">{pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${pct >= 100 ? "bg-emerald-500" : "bg-cyan-500"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end text-xs font-semibold text-cyan-700">
                  View details <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
