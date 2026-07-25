"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Field, inputCls, selectCls } from "@/components/admin/ui/Field";
import type { AdminBookingCustomerPayment, AdminBookingSupplierPayment, PaymentMode, SettlementStatus } from "@/types/admin";

interface Props {
  customerPayments: AdminBookingCustomerPayment[];
  supplierPayments: AdminBookingSupplierPayment[];
  onAddCustomerPayment: (payload: { paymentDate: string; paymentMode: PaymentMode; amount: number; transactionReference?: string; remarks?: string }) => Promise<void>;
  onAddSupplierPayment: (payload: { supplierName: string; paymentDate: string; amount: number; paymentMode: PaymentMode; transactionReference?: string; settlementStatus: SettlementStatus }) => Promise<void>;
}

const MODES: PaymentMode[] = ["Cash", "BankTransfer", "Card", "UPI", "Cheque", "Other"];
const SETTLEMENTS: SettlementStatus[] = ["Pending", "Settled", "Partial"];
const formatINR = (v: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", currencyDisplay: "code", maximumFractionDigits: 0 }).format(v);

export default function BookingPayments({ customerPayments, supplierPayments, onAddCustomerPayment, onAddSupplierPayment }: Props) {
  const [cDate, setCDate] = useState("");
  const [cMode, setCMode] = useState<PaymentMode>("Cash");
  const [cAmount, setCAmount] = useState(0);
  const [cRef, setCRef] = useState("");
  const [cRemarks, setCRemarks] = useState("");
  const [savingC, setSavingC] = useState(false);

  const [sSupplier, setSSupplier] = useState("");
  const [sDate, setSDate] = useState("");
  const [sMode, setSMode] = useState<PaymentMode>("Cash");
  const [sAmount, setSAmount] = useState(0);
  const [sRef, setSRef] = useState("");
  const [sSettlement, setSSettlement] = useState<SettlementStatus>("Pending");
  const [savingS, setSavingS] = useState(false);

  const addCustomer = async () => {
    if (!cDate || cAmount <= 0) return;
    setSavingC(true);
    try {
      await onAddCustomerPayment({ paymentDate: cDate, paymentMode: cMode, amount: cAmount, transactionReference: cRef, remarks: cRemarks });
      setCDate(""); setCAmount(0); setCRef(""); setCRemarks("");
    } finally {
      setSavingC(false);
    }
  };

  const addSupplier = async () => {
    if (!sSupplier || !sDate || sAmount <= 0) return;
    setSavingS(true);
    try {
      await onAddSupplierPayment({ supplierName: sSupplier, paymentDate: sDate, amount: sAmount, paymentMode: sMode, transactionReference: sRef, settlementStatus: sSettlement });
      setSSupplier(""); setSDate(""); setSAmount(0); setSRef("");
    } finally {
      setSavingS(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-3">Customer Payments</h3>
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 grid grid-cols-1 md:grid-cols-5 gap-3 items-end mb-3">
          <Field label="Payment Date"><input type="date" className={inputCls} value={cDate} onChange={(e) => setCDate(e.target.value)} /></Field>
          <Field label="Payment Mode">
            <select className={selectCls} value={cMode} onChange={(e) => setCMode(e.target.value as PaymentMode)}>
              {MODES.map((m) => (<option key={m} value={m}>{m}</option>))}
            </select>
          </Field>
          <Field label="Amount"><input type="number" min={0} className={inputCls} value={cAmount} onChange={(e) => setCAmount(Number(e.target.value) || 0)} /></Field>
          <Field label="Transaction Ref"><input className={inputCls} value={cRef} onChange={(e) => setCRef(e.target.value)} /></Field>
          <button type="button" onClick={addCustomer} disabled={savingC} className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50">
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
          <Field label="Remarks" className="md:col-span-5"><input className={inputCls} value={cRemarks} onChange={(e) => setCRemarks(e.target.value)} /></Field>
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-slate-500 uppercase border-b border-slate-100">
                <th className="px-3 py-2">Date</th><th className="px-3 py-2">Mode</th><th className="px-3 py-2 text-right">Amount</th><th className="px-3 py-2">Reference</th><th className="px-3 py-2">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {customerPayments.map((p, i) => (
                <tr key={p.id ?? i} className="border-b border-slate-50">
                  <td className="px-3 py-2">{p.paymentDate.slice(0, 10)}</td>
                  <td className="px-3 py-2">{p.paymentMode}</td>
                  <td className="px-3 py-2 text-right font-semibold">{formatINR(p.amount)}</td>
                  <td className="px-3 py-2 text-slate-500">{p.transactionReference || "—"}</td>
                  <td className="px-3 py-2 text-slate-500">{p.remarks || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {customerPayments.length === 0 && <p className="text-center py-6 text-sm text-slate-500">No customer payments recorded yet.</p>}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-3">Supplier Payments</h3>
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 grid grid-cols-1 md:grid-cols-6 gap-3 items-end mb-3">
          <Field label="Supplier"><input className={inputCls} value={sSupplier} onChange={(e) => setSSupplier(e.target.value)} /></Field>
          <Field label="Payment Date"><input type="date" className={inputCls} value={sDate} onChange={(e) => setSDate(e.target.value)} /></Field>
          <Field label="Amount"><input type="number" min={0} className={inputCls} value={sAmount} onChange={(e) => setSAmount(Number(e.target.value) || 0)} /></Field>
          <Field label="Payment Mode">
            <select className={selectCls} value={sMode} onChange={(e) => setSMode(e.target.value as PaymentMode)}>
              {MODES.map((m) => (<option key={m} value={m}>{m}</option>))}
            </select>
          </Field>
          <Field label="Settlement Status">
            <select className={selectCls} value={sSettlement} onChange={(e) => setSSettlement(e.target.value as SettlementStatus)}>
              {SETTLEMENTS.map((s) => (<option key={s} value={s}>{s}</option>))}
            </select>
          </Field>
          <button type="button" onClick={addSupplier} disabled={savingS} className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50">
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
          <Field label="Transaction Ref" className="md:col-span-6"><input className={inputCls} value={sRef} onChange={(e) => setSRef(e.target.value)} /></Field>
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-slate-500 uppercase border-b border-slate-100">
                <th className="px-3 py-2">Supplier</th><th className="px-3 py-2">Date</th><th className="px-3 py-2">Reference</th><th className="px-3 py-2 text-right">Amount</th><th className="px-3 py-2">Mode</th><th className="px-3 py-2">Settlement</th>
              </tr>
            </thead>
            <tbody>
              {supplierPayments.map((p, i) => (
                <tr key={p.id ?? i} className="border-b border-slate-50">
                  <td className="px-3 py-2">{p.supplierName}</td>
                  <td className="px-3 py-2">{p.paymentDate.slice(0, 10)}</td>
                  <td className="px-3 py-2 text-slate-500">{p.transactionReference || "—"}</td>
                  <td className="px-3 py-2 text-right font-semibold">{formatINR(p.amount)}</td>
                  <td className="px-3 py-2">{p.paymentMode}</td>
                  <td className="px-3 py-2">{p.settlementStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {supplierPayments.length === 0 && <p className="text-center py-6 text-sm text-slate-500">No supplier payments recorded yet.</p>}
        </div>
      </div>
    </div>
  );
}
