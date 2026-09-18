"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Users, CalendarDays, Wallet, Receipt, History, BadgeCheck, Eye, Download, Plane, BedDouble, FileText } from "lucide-react";
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
  hotels: { id: string }[];
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

        <div className="flex flex-wrap gap-3 mt-4 mb-5">
          <InfoChip
            icon={<CalendarDays className="w-4 h-4" />}
            label="Travel Date"
            value={booking.travelDate ? new Date(booking.travelDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Not set yet"}
            from="from-cyan-50" to="to-blue-50" border="border-cyan-100" iconBg="bg-cyan-600" labelColor="text-cyan-700/80"
          />
          <InfoChip
            icon={<Users className="w-4 h-4" />}
            label="Travellers"
            value={`${travellers} ${travellers !== 1 ? "Travellers" : "Traveller"}`}
            from="from-violet-50" to="to-fuchsia-50" border="border-violet-100" iconBg="bg-violet-600" labelColor="text-violet-700/80"
          />
        </div>

        <BookingJourneyTracker status={booking.status} />
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 mb-6">
        <h2 className="flex items-center gap-2 font-semibold text-slate-900 mb-4">
          <FileText className="w-4 h-4 text-cyan-600" /> Trip Documents
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <DocumentTicket
            icon={<Plane className="w-4 h-4" />}
            eyebrow="Travel Voucher"
            heading="Full Trip Itinerary"
            caption="Passengers, stays & day-wise plan"
            viewHref={`/api/customer/bookings/${booking.id}/travel-voucher`}
            downloadHref={`/api/customer/bookings/${booking.id}/travel-voucher?download=1`}
          />

          {booking.hotels.length > 0 && (
            <DocumentTicket
              icon={<BedDouble className="w-4 h-4" />}
              eyebrow="Hotel Voucher"
              heading="Accommodation Details"
              caption="Stay confirmation for your hotels"
              viewHref={`/api/customer/bookings/${booking.id}/hotel-voucher`}
              downloadHref={`/api/customer/bookings/${booking.id}/hotel-voucher?download=1`}
            />
          )}
        </div>
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

          {paid > 0 && (
            <div className="mt-5">
              <DocumentTicket
                icon={<BadgeCheck className="w-4 h-4" />}
                eyebrow="Payment Acknowledgement"
                heading={formatINR(paid)}
                caption={`Received so far${booking.lead ? ` · Ack No. ACK-${trackingCode(booking.lead.seq)}` : ""}`}
                viewHref={`/api/customer/bookings/${booking.id}/payment-acknowledgement`}
                downloadHref={`/api/customer/bookings/${booking.id}/payment-acknowledgement?download=1`}
              />
            </div>
          )}

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

function InfoChip({
  icon,
  label,
  value,
  from,
  to,
  border,
  iconBg,
  labelColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  from: string;
  to: string;
  border: string;
  iconBg: string;
  labelColor: string;
}) {
  return (
    <div className={`inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-br ${from} ${to} border ${border} px-3.5 py-2`}>
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconBg} text-white`}>{icon}</div>
      <div>
        <p className={`text-[10px] font-semibold uppercase leading-none tracking-wide ${labelColor}`}>{label}</p>
        <p className="mt-1 text-sm font-semibold leading-none text-slate-800">{value}</p>
      </div>
    </div>
  );
}

function DocumentTicket({
  icon,
  eyebrow,
  heading,
  caption,
  viewHref,
  downloadHref,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  heading: string;
  caption: string;
  viewHref: string;
  downloadHref: string;
}) {
  return (
    <div className="relative flex rounded-2xl border border-teal-100 shadow-sm overflow-hidden">
      <div className="flex-1 bg-gradient-to-br from-teal-600 to-cyan-700 p-4 sm:p-5 text-white">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15">{icon}</div>
          <p className="text-xs font-semibold uppercase tracking-wide text-white/85">{eyebrow}</p>
        </div>
        <p className="text-lg font-bold leading-tight">{heading}</p>
        <p className="mt-0.5 text-xs text-white/80">{caption}</p>
      </div>

      {/* Ticket-stub perforation between the info panel and the actions */}
      <div className="relative w-0 border-l-2 border-dashed border-teal-200/70">
        <span className="absolute -top-3 -left-3 h-6 w-6 rounded-full bg-white" />
        <span className="absolute -bottom-3 -left-3 h-6 w-6 rounded-full bg-white" />
      </div>

      <div className="flex w-36 sm:w-40 flex-col items-stretch justify-center gap-2 bg-white p-3 sm:p-4">
        <a
          href={viewHref}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-teal-200 px-3 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-50"
        >
          <Eye className="w-3.5 h-3.5" /> View
        </a>
        <a
          href={downloadHref}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700"
        >
          <Download className="w-3.5 h-3.5" /> Download
        </a>
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
