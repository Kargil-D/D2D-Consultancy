"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Edit, FileDown, Plus, Trash2 } from "lucide-react";
import { Field, inputCls, selectCls } from "@/components/admin/ui/Field";
import { useToast } from "@/components/admin/ui/Toast";
import BookingStatusStepper from "@/components/admin/booking/BookingStatusStepper";
import DocumentUpload from "@/components/admin/booking/DocumentUpload";
import { bookingsApi } from "@/lib/adminApi";
import type {
  AdminBooking,
  AdminBookingComponent,
  BookingComponentStatus,
  BookingComponentType,
  BookingDocumentType,
  BookingStatus,
} from "@/types/admin";

interface BookingDetailProps {
  id: string;
}

const bookingCode = (seq: number) => `BK-${seq.toString().padStart(4, "0")}`;
const formatINR = (v: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", currencyDisplay: "code", maximumFractionDigits: 0 }).format(v);

const DOCUMENT_TYPES: { type: BookingDocumentType; label: string }[] = [
  { type: "Passport", label: "Passport" },
  { type: "Visa", label: "Visa" },
  { type: "FlightTicket", label: "Flight Ticket" },
  { type: "Insurance", label: "Insurance" },
];

const COMPONENT_TYPES: BookingComponentType[] = ["Hotel", "Transfer", "Activity", "Visa"];

const statusOptionsFor = (component: BookingComponentType): BookingComponentStatus[] =>
  component === "Visa" ? ["Approved", "Rejected", "Pending"] : ["Pending", "Confirmed", "Cancelled"];

const emptyComponent = (sortOrder: number): AdminBookingComponent => ({
  component: "Hotel",
  detail: "",
  status: "Pending",
  sortOrder,
});

export default function BookingDetail({ id }: BookingDetailProps) {
  const { notify } = useToast();
  const [booking, setBooking] = useState<AdminBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [dmcName, setDmcName] = useState("");
  const [dmcEmailSentDate, setDmcEmailSentDate] = useState("");
  const [dmcResponse, setDmcResponse] = useState("");
  const [dmcRemarks, setDmcRemarks] = useState("");
  const [savingDmc, setSavingDmc] = useState(false);

  const [components, setComponents] = useState<AdminBookingComponent[]>([]);
  const [savingComponents, setSavingComponents] = useState(false);

  const reload = useCallback(async () => {
    const res = await bookingsApi.get(id);
    if (res.success && res.data) {
      const b = res.data;
      setBooking(b);
      setDmcName(b.dmcName ?? "");
      setDmcEmailSentDate(b.dmcEmailSentDate ? b.dmcEmailSentDate.slice(0, 10) : "");
      setDmcResponse(b.dmcResponse ?? "");
      setDmcRemarks(b.dmcRemarks ?? "");
      setComponents(b.components.length > 0 ? b.components : [emptyComponent(0)]);
    } else {
      notify(res.message || "Unable to load booking", "error");
    }
    setLoading(false);
  }, [id, notify]);

  useEffect(() => {
    reload();
  }, [reload]);

  const changeStatus = async (status: BookingStatus) => {
    if (!booking || status === booking.status) return;
    setUpdatingStatus(true);
    try {
      const res = await bookingsApi.updateStatus(id, status);
      if (!res.success) return notify(res.message || "Unable to update status", "error");
      notify(`Status updated to ${status}`, "success");
      reload();
    } finally {
      setUpdatingStatus(false);
    }
  };

  const saveDocument = async (type: BookingDocumentType, url: string) => {
    const res = await bookingsApi.uploadDocument(id, type, url);
    if (!res.success) return notify(res.message || "Unable to save document", "error");
    notify(`${type} uploaded`, "success");
    reload();
  };

  const saveDmc = async () => {
    setSavingDmc(true);
    try {
      const res = await bookingsApi.updateDmc(id, { dmcName, dmcEmailSentDate: dmcEmailSentDate || null, dmcResponse, dmcRemarks });
      if (!res.success) return notify(res.message || "Unable to save DMC details", "error");
      notify("DMC communication saved", "success");
    } finally {
      setSavingDmc(false);
    }
  };

  const updateComponent = (index: number, patch: Partial<AdminBookingComponent>) => {
    setComponents((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };
  const addComponentRow = () => setComponents((rows) => [...rows, emptyComponent(rows.length)]);
  const removeComponentRow = (index: number) =>
    setComponents((rows) => (rows.length > 1 ? rows.filter((_, i) => i !== index) : rows));

  const saveComponents = async () => {
    setSavingComponents(true);
    try {
      const res = await bookingsApi.saveComponents(id, components.map((c, i) => ({ ...c, sortOrder: i })));
      if (!res.success) return notify(res.message || "Unable to save components", "error");
      notify("Booking components saved", "success");
      reload();
    } finally {
      setSavingComponents(false);
    }
  };

  const generateVoucher = () => {
    window.open(`/api/admin/bookings/${id}/voucher`, "_blank");
    setTimeout(reload, 1000);
  };

  if (loading) {
    return (
      <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center text-sm text-slate-500">
        Loading…
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center text-sm text-slate-500">
        Booking not found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white border border-slate-200 p-6">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
          <div>
            <span className="font-mono text-xs font-semibold text-slate-500">{bookingCode(booking.seq)}</span>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">{booking.lead?.customerName ?? "—"}</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {booking.destination?.name} · {formatINR(booking.totalAmount)}
            </p>
          </div>
          <Link
            href={`/admin/bookings/${id}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50"
          >
            <Edit className="w-4 h-4" /> Edit
          </Link>
        </div>
        <BookingStatusStepper status={booking.status} onChange={changeStatus} disabled={updatingStatus} />
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 p-6">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Documents</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {DOCUMENT_TYPES.map(({ type, label }) => {
            const doc = booking.documents.find((d) => d.type === type);
            return (
              <DocumentUpload
                key={type}
                label={label}
                value={doc?.url}
                onChange={(url) => saveDocument(type, url)}
              />
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 p-6">
        <h3 className="text-sm font-bold text-slate-900 mb-4">DMC Communication</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="DMC Name">
            <input className={inputCls} value={dmcName} onChange={(e) => setDmcName(e.target.value)} />
          </Field>
          <Field label="Email Sent Date">
            <input type="date" className={inputCls} value={dmcEmailSentDate} onChange={(e) => setDmcEmailSentDate(e.target.value)} />
          </Field>
          <Field label="Response">
            <input className={inputCls} value={dmcResponse} onChange={(e) => setDmcResponse(e.target.value)} />
          </Field>
          <Field label="Remarks">
            <input className={inputCls} value={dmcRemarks} onChange={(e) => setDmcRemarks(e.target.value)} />
          </Field>
        </div>
        <button
          type="button"
          onClick={saveDmc}
          disabled={savingDmc}
          className="mt-4 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          Save DMC Details
        </button>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-900">Booking Components</h3>
          <button
            type="button"
            onClick={addComponentRow}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
          >
            <Plus className="w-3.5 h-3.5" /> Add Row
          </button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-semibold text-slate-500 uppercase border-b border-slate-100">
              <th className="px-4 py-2 w-40">Component</th>
              <th className="px-4 py-2">Detail</th>
              <th className="px-4 py-2 w-44">Status</th>
              <th className="px-4 py-2 w-10" />
            </tr>
          </thead>
          <tbody>
            {components.map((row, i) => (
              <tr key={i} className="border-b border-slate-50">
                <td className="px-4 py-2">
                  <select
                    className={selectCls}
                    value={row.component}
                    onChange={(e) => {
                      const component = e.target.value as BookingComponentType;
                      updateComponent(i, { component, status: statusOptionsFor(component)[0] });
                    }}
                  >
                    {COMPONENT_TYPES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2">
                  <input className={inputCls} value={row.detail} onChange={(e) => updateComponent(i, { detail: e.target.value })} placeholder="e.g. 4-star hotel, 3 nights" />
                </td>
                <td className="px-4 py-2">
                  <select className={selectCls} value={row.status} onChange={(e) => updateComponent(i, { status: e.target.value as BookingComponentStatus })}>
                    {statusOptionsFor(row.component).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2 text-right">
                  <button type="button" onClick={() => removeComponentRow(i)} className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50" aria-label="Remove">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-6 py-4 border-t border-slate-100">
          <button
            type="button"
            onClick={saveComponents}
            disabled={savingComponents}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            Save Components
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 p-6 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Travel Voucher</h3>
          <p className="text-xs text-slate-500 mt-0.5">Generates the voucher PDF and advances the booking toward Booked.</p>
        </div>
        <button
          type="button"
          onClick={generateVoucher}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700"
        >
          <FileDown className="w-4 h-4" /> Generate Voucher
        </button>
      </div>
    </div>
  );
}
