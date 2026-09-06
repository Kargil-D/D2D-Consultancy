"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Users, CalendarDays, Wallet, Receipt, History } from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import BookingStatusBadge from "@/components/account/BookingStatusBadge";
import BookingJourneyTracker from "@/components/account/BookingJourneyTracker";
import { trackingCode } from "@/lib/idCodes";
import type { AdminBookingCustomerPayment, AdminBookingTimelineEvent, BookingStatus } from "@/types/admin";

interface BookingDetailData {
  id: string;
  status: BookingStatus;
  travelDate: string | null;
  adults: number;
  children: number;
  infants: number;
  totalAmount: number;
  remarks: string | null;
  destination?: { name: string };
  lead?: { seq: number };
  customerPayments: AdminBookingCustomerPayment[];
  timeline: AdminBookingTimelineEvent[];
}

const formatINR = (v: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", currencyDisplay: "code", maximumFractionDigits: 0 }).format(v);

const MODE_LABELS: Record<string, string> = {
  Cash: "Cash",
  BankTransfer: "Bank Transfer",
  Card: "Card",
  UPI: "UPI",
  Cheque: "Cheque",
  Other: "Other",
};

export default function BookingTracking({ id }: { id: string }) {
  const [booking, setBooking] = useState<BookingDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<{ booking: BookingDetailData }>(`/api/customer/bookings/${id}`)
      .then((data) => setBooking(data.booking))
      .catch((e) => setError(e instanceof Error ? e.message : "Unable to load this booking"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center text-sm text-slate-500">Loading…</div>;
  }

  if (error || !booking) {
    return (
      <div>
        <BackLink />
        <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center text-sm text-rose-600">
          {error ?? "Booking not found"}
        </div>
      </div>
    );
  }

  const paid = booking.customerPayments.reduce((sum, p) => sum + p.amount, 0);
  const balance = Math.max(0, booking.totalAmount - paid);
  const pct = booking.totalAmount > 0 ? Math.min(100, Math.round((paid / booking.totalAmount) * 100)) : 0;
  const travellers = booking.adults + booking.children + booking.infants;

  return (
    <div>
      <BackLink />

      <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-1">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{booking.destination?.name ?? "Your Trip"}</h1>
            {booking.lead && (
              <p className="text-xs text-slate-400 mt-0.5">Tracking ID #{trackingCode(booking.lead.seq)}</p>
            )}
          </div>
          <BookingStatusBadge status={booking.status} />
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-500 mt-3 mb-5">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="w-4 h-4" />
            {booking.travelDate ? new Date(booking.travelDate).toLocaleDateString("en-IN") : "Travel date not set"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users className="w-4 h-4" /> {travellers} traveller{travellers !== 1 ? "s" : ""}
          </span>
        </div>

        <BookingJourneyTracker status={booking.status} />
      </div>

      {booking.totalAmount > 0 && (
        <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 mb-6">
          <h2 className="flex items-center gap-2 font-semibold text-slate-900 mb-4">
            <Wallet className="w-4 h-4 text-cyan-600" /> Payment Summary
          </h2>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Total Cost</p>
              <p className="font-semibold text-slate-900">{formatINR(booking.totalAmount)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Paid</p>
              <p className="font-semibold text-emerald-600">{formatINR(paid)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Balance Due</p>
              <p className={`font-semibold ${balance > 0 ? "text-amber-600" : "text-emerald-600"}`}>{formatINR(balance)}</p>
            </div>
          </div>

          <div className="h-2 rounded-full bg-slate-100 overflow-hidden mb-2">
            <div className={`h-full rounded-full ${pct >= 100 ? "bg-emerald-500" : "bg-cyan-500"}`} style={{ width: `${pct}%` }} />
          </div>
          <p className="text-xs text-slate-400">{pct}% paid</p>

          {booking.customerPayments.length > 0 && (
            <div className="mt-5 border-t border-slate-100 pt-4">
              <h3 className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                <Receipt className="w-3.5 h-3.5" /> Payment History
              </h3>
              <div className="space-y-2">
                {booking.customerPayments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-sm py-2 border-b border-slate-50 last:border-0">
                    <div>
                      <p className="font-medium text-slate-800">
                        {new Date(p.paymentDate).toLocaleDateString("en-IN")} · {MODE_LABELS[p.paymentMode] ?? p.paymentMode}
                      </p>
                      {p.transactionReference && <p className="text-xs text-slate-400">Ref: {p.transactionReference}</p>}
                    </div>
                    <span className="font-semibold text-slate-900">{formatINR(p.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6">
        <h2 className="flex items-center gap-2 font-semibold text-slate-900 mb-4">
          <History className="w-4 h-4 text-cyan-600" /> Activity History
        </h2>

        {booking.timeline.length === 0 ? (
          <p className="text-sm text-slate-400">No updates yet — we&apos;ll post progress here as your trip is prepared.</p>
        ) : (
          <ol className="relative border-l border-slate-200 ml-1.5 space-y-5">
            {booking.timeline.map((event) => (
              <li key={event.id} className="relative ml-4">
                <div className="absolute -left-5 top-1.5 w-2 h-2 rounded-full bg-cyan-500" />
                <p className="text-sm text-slate-700">{event.message}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {new Date(event.createdDate).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link href="/account/activities" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-4">
      <ChevronLeft className="w-4 h-4" /> Back to Your Activities
    </Link>
  );
}
