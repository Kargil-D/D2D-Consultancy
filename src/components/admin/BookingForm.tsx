"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Field, inputCls, selectCls, textareaCls } from "@/components/admin/ui/Field";
import { useToast } from "@/components/admin/ui/Toast";
import { bookingsApi, leadsApi, quotationsApi, salesUsersApi } from "@/lib/adminApi";
import type { AdminLead, AdminQuotation, AdminSalesUser, BookingStatus } from "@/types/admin";

interface BookingFormProps {
  id?: string;
}

const STATUSES: BookingStatus[] = ["Assigned", "DmcSent", "AwaitingConfirmation", "Confirmed", "VoucherGenerated", "Booked"];

const leadCode = (seq: number) => `LD-${seq.toString().padStart(4, "0")}`;
const quoteCode = (seq: number) => `QT-${seq.toString().padStart(4, "0")}`;
const formatINR = (v: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", currencyDisplay: "code", maximumFractionDigits: 0 }).format(v);

export default function BookingForm({ id }: BookingFormProps) {
  const router = useRouter();
  const { notify } = useToast();

  const [wonLeads, setWonLeads] = useState<AdminLead[]>([]);
  const [quotations, setQuotations] = useState<AdminQuotation[]>([]);
  const [bookingExecutives, setBookingExecutives] = useState<AdminSalesUser[]>([]);
  const [customerSupportUsers, setCustomerSupportUsers] = useState<AdminSalesUser[]>([]);

  const [leadId, setLeadId] = useState("");
  const [quotationId, setQuotationId] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [bookingExecutiveId, setBookingExecutiveId] = useState("");
  const [customerSupportId, setCustomerSupportId] = useState("");
  const [totalAmount, setTotalAmount] = useState(0);
  const [status, setStatus] = useState<BookingStatus>("Assigned");
  const [remarks, setRemarks] = useState("");

  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);

  const selectedLead = wonLeads.find((l) => l.id === leadId);
  const selectedQuotation = quotations.find((q) => q.id === quotationId);

  useEffect(() => {
    (async () => {
      const [leadsRes, beRes, csRes] = await Promise.all([
        leadsApi.list({ pageSize: 200, filter: { status: "Won" } }),
        salesUsersApi.list("BookingExecutive"),
        salesUsersApi.list("CustomerSupport"),
      ]);
      if (leadsRes.success) setWonLeads(leadsRes.data.items);
      if (beRes.success) setBookingExecutives(beRes.data);
      if (csRes.success) setCustomerSupportUsers(csRes.data);
    })();
  }, []);

  // Load quotations for the selected lead (the "Won Lead / Quotation" dropdown).
  useEffect(() => {
    if (!leadId) {
      setQuotations([]);
      return;
    }
    quotationsApi.list({ leadId, pageSize: 100 }).then((res) => {
      if (res.success) setQuotations(res.data.items);
    });
  }, [leadId]);

  const applyLead = (nextLeadId: string) => {
    setLeadId(nextLeadId);
    setQuotationId("");
    const lead = wonLeads.find((l) => l.id === nextLeadId);
    if (lead) {
      setDestinationId(lead.destinationId);
      setTravelDate(lead.travelDate ? lead.travelDate.slice(0, 10) : "");
    }
  };

  useEffect(() => {
    if (!id) return;
    (async () => {
      const res = await bookingsApi.get(id);
      if (res.success && res.data) {
        const b = res.data;
        setLeadId(b.leadId);
        setQuotationId(b.quotationId ?? "");
        setDestinationId(b.destinationId);
        setTravelDate(b.travelDate ? b.travelDate.slice(0, 10) : "");
        setBookingExecutiveId(b.bookingExecutiveId ?? "");
        setCustomerSupportId(b.customerSupportId ?? "");
        setTotalAmount(b.totalAmount);
        setStatus(b.status);
        setRemarks(b.remarks ?? "");
      } else {
        notify(res.message || "Unable to load booking", "error");
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const canSave = !!leadId && !!destinationId && !!bookingExecutiveId && !!customerSupportId;

  const save = async () => {
    if (!canSave) return notify("Won Lead, destination, Booking Executive and Customer Support are required", "error");
    const payload = {
      leadId,
      quotationId: quotationId || null,
      destinationId,
      travelDate: travelDate || null,
      bookingExecutiveId,
      customerSupportId,
      totalAmount,
      remarks,
    };

    setSaving(true);
    try {
      if (id) {
        const res = await bookingsApi.update(id, payload);
        if (!res.success) return notify(res.message || "Unable to update booking", "error");
        if (status !== res.data?.status) await bookingsApi.updateStatus(id, status);
        notify("Booking updated", "success");
      } else {
        const res = await bookingsApi.create(payload);
        if (!res.success) return notify(res.message || "Unable to create booking", "error");
        notify("Booking created", "success");
      }
      router.push("/admin/bookings");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Unexpected error", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center text-sm text-slate-500">
        Loading…
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
        <h2 className="text-xl font-bold text-slate-900">{id ? "Edit Booking" : "New Booking"}</h2>
        <div className="flex items-center gap-2">
          <Link href="/admin/bookings" className="px-4 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100">
            Cancel
          </Link>
          <button
            type="button"
            onClick={save}
            disabled={!canSave || saving}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm ${
              !canSave || saving ? "opacity-50 cursor-not-allowed hover:bg-blue-600" : ""
            }`}
          >
            {id ? "Update" : "Save Booking"}
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Won Lead" required>
            <select className={selectCls} value={leadId} onChange={(e) => applyLead(e.target.value)} disabled={!!id}>
              <option value="">Select a won lead</option>
              {wonLeads.map((l) => (
                <option key={l.id} value={l.id}>
                  {leadCode(l.seq)} — {l.customerName}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Quotation" hint="Optional — the winning quote">
            <select className={selectCls} value={quotationId} onChange={(e) => setQuotationId(e.target.value)} disabled={!leadId}>
              <option value="">No quotation</option>
              {quotations.map((q) => (
                <option key={q.id} value={q.id}>
                  {quoteCode(q.seq)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Customer">
            <input className={inputCls} value={selectedLead?.customerName ?? ""} disabled />
          </Field>
          <Field label="Destination">
            <input className={inputCls} value={selectedLead?.destination?.name ?? ""} disabled />
          </Field>
          <Field label="Travel Date">
            <input type="date" className={inputCls} value={travelDate} onChange={(e) => setTravelDate(e.target.value)} />
          </Field>
          <Field label="Booking Status">
            <select className={selectCls} value={status} onChange={(e) => setStatus(e.target.value as BookingStatus)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Assign Booking Executive" required>
            <select className={selectCls} value={bookingExecutiveId} onChange={(e) => setBookingExecutiveId(e.target.value)}>
              <option value="">Select Booking Executive</option>
              {bookingExecutives.map((u) => (
                <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
              ))}
            </select>
          </Field>
          <Field label="Assign Customer Support" required>
            <select className={selectCls} value={customerSupportId} onChange={(e) => setCustomerSupportId(e.target.value)}>
              <option value="">Select Customer Support</option>
              {customerSupportUsers.map((u) => (
                <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
              ))}
            </select>
          </Field>
          <Field label="Total Amount (INR)">
            <input type="number" min={0} className={inputCls} value={totalAmount} onChange={(e) => setTotalAmount(Number(e.target.value) || 0)} />
          </Field>
        </div>

        <Field label="Remarks">
          <textarea className={textareaCls} value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={4} />
        </Field>

        {selectedQuotation && (
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">
                Quotation {quoteCode(selectedQuotation.seq)}
              </h3>
              <span className="text-xs font-semibold text-slate-500">{selectedQuotation.status}</span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-slate-500 uppercase border-b border-slate-100">
                  <th className="px-4 py-2">Component</th>
                  <th className="px-4 py-2">Detail</th>
                  <th className="px-4 py-2 text-right">Qty</th>
                  <th className="px-4 py-2 text-right">Cost</th>
                  <th className="px-4 py-2 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedQuotation.items.map((item, i) => (
                  <tr key={item.id ?? i} className="border-b border-slate-50">
                    <td className="px-4 py-2">{item.component}</td>
                    <td className="px-4 py-2 text-slate-600">{item.detail}</td>
                    <td className="px-4 py-2 text-right">{item.qty}</td>
                    <td className="px-4 py-2 text-right">{formatINR(item.cost)}</td>
                    <td className="px-4 py-2 text-right">{formatINR(item.qty * item.cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(() => {
              const totalCost = selectedQuotation.items.reduce((sum, i) => sum + i.qty * i.cost, 0);
              const marginValue = Math.round(totalCost * (selectedQuotation.marginPercent / 100));
              const sellingPrice = totalCost + marginValue;
              return (
                <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex flex-col gap-1 text-sm">
                  <div className="flex justify-between text-slate-500">
                    <span>Total Cost</span>
                    <span>{formatINR(totalCost)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Margin ({selectedQuotation.marginPercent}%)</span>
                    <span>{formatINR(marginValue)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>Selling Price</span>
                    <span>{formatINR(sellingPrice)}</span>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
