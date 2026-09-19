"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus, Receipt, X } from "lucide-react";
import { Field, inputCls, selectCls } from "@/components/admin/ui/Field";
import DateInput from "@/components/admin/ui/DateInput";
import ImageUpload from "@/components/admin/ui/ImageUpload";
import ConfirmModal from "@/components/admin/ui/ConfirmModal";
import type { AdminBookingCustomerPayment, PaymentMode } from "@/types/admin";

interface Props {
  customerPayments: AdminBookingCustomerPayment[];
  /** Resolves true when the payment was recorded (the form is cleared only then). */
  onAddCustomerPayment: (payload: { paymentDate: string; paymentMode: PaymentMode; amount: number; transactionReference?: string; referenceImageUrl?: string; remarks?: string }) => Promise<boolean>;
  onRemoveCustomerPayment: (paymentId: string) => Promise<void>;
  /** Deal price + margin — the most the customer can be recorded as paying. Undefined when nothing to cap against. */
  totalPrice?: number;
}

const MODES: PaymentMode[] = ["Cash", "BankTransfer", "Card", "UPI", "Cheque", "Other"];
const formatINR = (v: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", currencyDisplay: "code", maximumFractionDigits: 0 }).format(v);

export default function BookingPayments({ customerPayments, onAddCustomerPayment, onRemoveCustomerPayment, totalPrice }: Props) {
  const [cDate, setCDate] = useState("");
  const [cMode, setCMode] = useState<PaymentMode>("Cash");
  const [cAmount, setCAmount] = useState(0);
  const [cRef, setCRef] = useState("");
  const [cRefImage, setCRefImage] = useState("");
  const [cRemarks, setCRemarks] = useState("");
  const [savingC, setSavingC] = useState(false);
  const [removing, setRemoving] = useState<AdminBookingCustomerPayment | null>(null);
  const [removingBusy, setRemovingBusy] = useState(false);

  const totalPaid = customerPayments.reduce((sum, p) => sum + p.amount, 0);
  const balance = totalPrice !== undefined ? totalPrice - totalPaid : undefined;
  // What this payment would push the total received to — blocked once it passes the total price.
  const exceedsTotal = balance !== undefined && cAmount > balance;

  const addCustomer = async () => {
    if (!cDate || cAmount <= 0 || exceedsTotal) return;
    setSavingC(true);
    try {
      const saved = await onAddCustomerPayment({ paymentDate: cDate, paymentMode: cMode, amount: cAmount, transactionReference: cRef, referenceImageUrl: cRefImage || undefined, remarks: cRemarks });
      if (saved) { setCDate(""); setCAmount(0); setCRef(""); setCRefImage(""); setCRemarks(""); }
    } finally {
      setSavingC(false);
    }
  };

  const confirmRemove = async () => {
    if (!removing?.id) return;
    setRemovingBusy(true);
    try {
      await onRemoveCustomerPayment(removing.id);
      setRemoving(null);
    } finally {
      setRemovingBusy(false);
    }
  };

  return (
    <div>
      <h3 className="text-sm font-bold text-slate-900 mb-3">Customer Payments</h3>
      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 grid grid-cols-1 md:grid-cols-6 gap-3 items-end mb-3">
        <Field label="Payment Date"><DateInput value={cDate} onChange={(iso) => setCDate(iso)} /></Field>
        <Field label="Payment Mode">
          <select className={selectCls} value={cMode} onChange={(e) => setCMode(e.target.value as PaymentMode)}>
            {MODES.map((m) => (<option key={m} value={m}>{m}</option>))}
          </select>
        </Field>
        <Field
          label="Amount"
          hint={balance !== undefined ? `Up to ${formatINR(Math.max(0, balance))} remaining` : undefined}
          error={exceedsTotal ? `Exceeds the total price by ${formatINR(cAmount - (balance ?? 0))}` : undefined}
        >
          <input type="number" min={0} max={balance !== undefined ? Math.max(0, balance) : undefined} className={inputCls} value={cAmount} onChange={(e) => setCAmount(Number(e.target.value) || 0)} />
        </Field>
        <Field label="Transaction Ref"><input className={inputCls} value={cRef} onChange={(e) => setCRef(e.target.value)} /></Field>
        <Field label="Reference Image">
          <ImageUpload value={cRefImage} onChange={setCRefImage} label="Upload" compact />
        </Field>
        <button type="button" onClick={addCustomer} disabled={savingC || exceedsTotal} className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50">
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
        <Field label="Remarks" className="md:col-span-6"><input className={inputCls} value={cRemarks} onChange={(e) => setCRemarks(e.target.value)} /></Field>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-semibold text-slate-500 uppercase border-b border-slate-100">
              <th className="px-3 py-2">Date</th><th className="px-3 py-2">Mode</th><th className="px-3 py-2 text-right">Amount</th><th className="px-3 py-2">Reference</th><th className="px-3 py-2">Ref. Image</th><th className="px-3 py-2">Remarks</th><th className="px-3 py-2 w-10"><span className="sr-only">Remove</span></th>
            </tr>
          </thead>
          <tbody>
            {customerPayments.map((p, i) => (
              <tr key={p.id ?? i} className="border-b border-slate-50">
                <td className="px-3 py-2">{p.paymentDate.slice(0, 10)}</td>
                <td className="px-3 py-2">{p.paymentMode}</td>
                <td className="px-3 py-2 text-right font-semibold">{formatINR(p.amount)}</td>
                <td className="px-3 py-2 text-slate-500">{p.transactionReference || "—"}</td>
                <td className="px-3 py-2">
                  {p.referenceImageUrl ? (
                    <a href={p.referenceImageUrl} target="_blank" rel="noreferrer" className="block relative w-9 h-9 rounded-md overflow-hidden border border-slate-200 hover:opacity-80">
                      <Image src={p.referenceImageUrl} alt="Payment reference" fill sizes="36px" className="object-cover" unoptimized />
                    </a>
                  ) : (
                    <span className="text-slate-300"><Receipt className="w-4 h-4" /></span>
                  )}
                </td>
                <td className="px-3 py-2 text-slate-500">{p.remarks || "—"}</td>
                <td className="px-3 py-2 text-right">
                  {p.id && (
                    <button
                      type="button"
                      onClick={() => setRemoving(p)}
                      aria-label={`Remove payment of ${formatINR(p.amount)}`}
                      title="Remove this payment"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {customerPayments.length === 0 && <p className="text-center py-6 text-sm text-slate-500">No customer payments recorded yet.</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Price</div>
          <div className="text-lg font-bold text-slate-900 mt-0.5">{totalPrice !== undefined ? formatINR(totalPrice) : "—"}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Balance</div>
          <div className={`text-lg font-bold mt-0.5 ${balance !== undefined && balance <= 0 ? "text-emerald-600" : "text-rose-600"}`}>
            {balance !== undefined ? formatINR(balance) : "—"}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Paid</div>
          <div className="text-lg font-bold text-emerald-600 mt-0.5">{formatINR(totalPaid)}</div>
        </div>
      </div>

      <ConfirmModal
        open={!!removing}
        title="Remove this payment?"
        message={removing ? `The ${formatINR(removing.amount)} payment${removing.paymentDate ? ` dated ${removing.paymentDate.slice(0, 10)}` : ""} will be deleted and the balance recalculated. If a payment receipt was already issued it will show as out of date.` : ""}
        confirmText="Remove"
        loading={removingBusy}
        onConfirm={confirmRemove}
        onCancel={() => setRemoving(null)}
      />
    </div>
  );
}
