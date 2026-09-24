"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus, Receipt, X } from "lucide-react";
import { Field, inputCls, selectCls } from "@/components/admin/ui/Field";
import DateInput from "@/components/admin/ui/DateInput";
import ImageUpload from "@/components/admin/ui/ImageUpload";
import ConfirmModal from "@/components/admin/ui/ConfirmModal";
import type { AdminBookingSupplierPayment, PaymentMode, SettlementStatus } from "@/types/admin";

type NewSupplierPayment = { supplierName: string; paymentDate: string; amount: number; paymentMode: PaymentMode; transactionReference?: string; referenceImageUrl?: string; settlementStatus: SettlementStatus };

interface Props {
  supplierPayments: AdminBookingSupplierPayment[];
  /** Resolves true when the payment was recorded (the form is cleared only then). */
  onAddSupplierPayment: (payload: NewSupplierPayment) => Promise<boolean>;
  onRemoveSupplierPayment: (paymentId: string) => Promise<void>;
  /** The booking's Supplier Invoice Amount — the most that can be paid out. Undefined when none is recorded yet. */
  totalPrice?: number;
}

const MODES: PaymentMode[] = ["Cash", "BankTransfer", "Card", "UPI", "Cheque", "Other"];
const STATUSES: SettlementStatus[] = ["Pending", "Partial", "Settled"];
const formatINR = (v: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", currencyDisplay: "code", maximumFractionDigits: 0 }).format(v);

export default function SupplierPayments({ supplierPayments, onAddSupplierPayment, onRemoveSupplierPayment, totalPrice }: Props) {
  const [supplier, setSupplier] = useState("");
  const [date, setDate] = useState("");
  const [mode, setMode] = useState<PaymentMode>("BankTransfer");
  const [amount, setAmount] = useState(0);
  const [ref, setRef] = useState("");
  const [refImage, setRefImage] = useState("");
  const [status, setStatus] = useState<SettlementStatus>("Pending");
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState<AdminBookingSupplierPayment | null>(null);
  const [removingBusy, setRemovingBusy] = useState(false);

  const totalPaid = supplierPayments.reduce((sum, p) => sum + p.amount, 0);
  const balance = totalPrice !== undefined ? totalPrice - totalPaid : undefined;
  const exceedsTotal = balance !== undefined && amount > balance;

  const add = async () => {
    if (!supplier.trim() || !date || amount <= 0 || exceedsTotal) return;
    setSaving(true);
    try {
      const saved = await onAddSupplierPayment({ supplierName: supplier.trim(), paymentDate: date, amount, paymentMode: mode, transactionReference: ref, referenceImageUrl: refImage || undefined, settlementStatus: status });
      if (saved) { setSupplier(""); setDate(""); setAmount(0); setRef(""); setRefImage(""); setStatus("Pending"); }
    } finally {
      setSaving(false);
    }
  };

  const confirmRemove = async () => {
    if (!removing?.id) return;
    setRemovingBusy(true);
    try {
      await onRemoveSupplierPayment(removing.id);
      setRemoving(null);
    } finally {
      setRemovingBusy(false);
    }
  };

  return (
    <div>
      <h3 className="text-sm font-bold text-slate-900 mb-3">Supplier Payments</h3>
      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 grid grid-cols-1 md:grid-cols-7 gap-3 items-end mb-3">
        <Field label="Supplier Name" required className="md:col-span-2">
          <input className={inputCls} value={supplier} onChange={(e) => setSupplier(e.target.value)} />
        </Field>
        <Field label="Payment Date"><DateInput value={date} onChange={(iso) => setDate(iso)} /></Field>
        <Field label="Payment Mode">
          <select className={selectCls} value={mode} onChange={(e) => setMode(e.target.value as PaymentMode)}>
            {MODES.map((m) => (<option key={m} value={m}>{m}</option>))}
          </select>
        </Field>
        <Field
          label="Amount"
          hint={balance !== undefined ? `Up to ${formatINR(Math.max(0, balance))} remaining` : "No supplier invoice amount set — no limit"}
          error={exceedsTotal ? `Exceeds the total price by ${formatINR(amount - (balance ?? 0))}` : undefined}
        >
          <input type="number" min={0} max={balance !== undefined ? Math.max(0, balance) : undefined} className={inputCls} value={amount} onChange={(e) => setAmount(Number(e.target.value) || 0)} />
        </Field>
        <Field label="Transaction Ref"><input className={inputCls} value={ref} onChange={(e) => setRef(e.target.value)} /></Field>
        <Field label="Reference Image">
          <ImageUpload value={refImage} onChange={setRefImage} label="Upload" compact />
        </Field>
        <Field label="Settlement Status" className="md:col-span-2">
          <select className={selectCls} value={status} onChange={(e) => setStatus(e.target.value as SettlementStatus)}>
            {STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
        </Field>
        <button type="button" onClick={add} disabled={saving || exceedsTotal} className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 md:col-start-7">
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-semibold text-slate-500 uppercase border-b border-slate-100">
              <th className="px-3 py-2">Date</th><th className="px-3 py-2">Supplier</th><th className="px-3 py-2">Mode</th><th className="px-3 py-2 text-right">Amount</th><th className="px-3 py-2">Reference</th><th className="px-3 py-2">Ref. Image</th><th className="px-3 py-2">Status</th><th className="px-3 py-2 w-10"><span className="sr-only">Remove</span></th>
            </tr>
          </thead>
          <tbody>
            {supplierPayments.map((p, i) => (
              <tr key={p.id ?? i} className="border-b border-slate-50">
                <td className="px-3 py-2">{p.paymentDate.slice(0, 10)}</td>
                <td className="px-3 py-2">{p.supplierName}</td>
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
                <td className="px-3 py-2 text-slate-500">{p.settlementStatus}</td>
                <td className="px-3 py-2 text-right">
                  {p.id && (
                    <button
                      type="button"
                      onClick={() => setRemoving(p)}
                      aria-label={`Remove payment of ${formatINR(p.amount)} to ${p.supplierName}`}
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
        {supplierPayments.length === 0 && <p className="text-center py-6 text-sm text-slate-500">No supplier payments recorded yet.</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Price</div>
          <div className="text-lg font-bold text-slate-900 mt-0.5">{totalPrice !== undefined ? formatINR(totalPrice) : "—"}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Supplier Invoice Amount</div>
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
        message={removing ? `The ${formatINR(removing.amount)} payment to ${removing.supplierName}${removing.paymentDate ? ` dated ${removing.paymentDate.slice(0, 10)}` : ""} will be deleted and the balance recalculated.` : ""}
        confirmText="Remove"
        loading={removingBusy}
        onConfirm={confirmRemove}
        onCancel={() => setRemoving(null)}
      />
    </div>
  );
}
