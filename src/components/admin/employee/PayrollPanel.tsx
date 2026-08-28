"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Lock, ShieldAlert, Trash2 } from "lucide-react";
import { Field, inputCls, selectCls } from "@/components/admin/ui/Field";
import ConfirmModal from "@/components/admin/ui/ConfirmModal";
import { useToast } from "@/components/admin/ui/Toast";
import { payrollApi } from "@/lib/adminApi";
import type { AdminPayslip } from "@/types/admin";

interface Props {
  employeeId: string;
  /** Admin viewing their own linked employee record — payroll is never self-editable, even for an Admin, matching how a real payroll desk works. */
  isSelf: boolean;
}

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

type Line = { key: keyof typeof EMPTY_AMOUNTS; label: string };
const EARNING_LINES: Line[] = [
  { key: "basicSalary", label: "Basic Salary" },
  { key: "hra", label: "HRA" },
  { key: "otherAllowances", label: "Other Allowances" },
  { key: "bonus", label: "Bonus" },
];
const DEDUCTION_LINES: Line[] = [
  { key: "pfDeduction", label: "Provident Fund" },
  { key: "esiDeduction", label: "ESI" },
  { key: "professionalTax", label: "Professional Tax" },
  { key: "tds", label: "TDS" },
  { key: "otherDeductions", label: "Other Deductions" },
];

const EMPTY_AMOUNTS = {
  basicSalary: 0, hra: 0, otherAllowances: 0, bonus: 0,
  pfDeduction: 0, esiDeduction: 0, professionalTax: 0, tds: 0, otherDeductions: 0,
};

const formatINR = (v: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);

export default function PayrollPanel({ employeeId, isSelf }: Props) {
  const { notify } = useToast();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const [history, setHistory] = useState<AdminPayslip[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const [current, setCurrent] = useState<AdminPayslip | null>(null);
  const [periodLoading, setPeriodLoading] = useState(true);
  const [amounts, setAmounts] = useState(EMPTY_AMOUNTS);
  const [pfNumber, setPfNumber] = useState("");
  const [esiNumber, setEsiNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [confirmFinalize, setConfirmFinalize] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    const res = await payrollApi.list(employeeId);
    if (res.success) setHistory(res.data);
    else notify(res.message || "Unable to load payroll history", "error");
    setHistoryLoading(false);
  }, [employeeId, notify]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    let cancelled = false;
    setPeriodLoading(true);
    payrollApi.get(employeeId, year, month).then((res) => {
      if (cancelled) return;
      const data = res.success ? res.data : null;
      setCurrent(data);
      setAmounts(data ? {
        basicSalary: data.basicSalary, hra: data.hra, otherAllowances: data.otherAllowances, bonus: data.bonus,
        pfDeduction: data.pfDeduction, esiDeduction: data.esiDeduction, professionalTax: data.professionalTax, tds: data.tds, otherDeductions: data.otherDeductions,
      } : EMPTY_AMOUNTS);
      setPfNumber(data?.pfNumber ?? "");
      setEsiNumber(data?.esiNumber ?? "");
      setNotes(data?.notes ?? "");
      setPeriodLoading(false);
    });
    return () => { cancelled = true; };
  }, [employeeId, year, month]);

  const grossPay = EARNING_LINES.reduce((sum, l) => sum + (amounts[l.key] || 0), 0);
  const totalDeductions = DEDUCTION_LINES.reduce((sum, l) => sum + (amounts[l.key] || 0), 0);
  const netPay = grossPay - totalDeductions;

  const isFinalized = current?.status === "Finalized";
  const readOnly = isSelf || isFinalized;

  const setAmount = (key: keyof typeof EMPTY_AMOUNTS, raw: string) => {
    const n = raw === "" ? 0 : Math.max(0, Math.round(Number(raw)));
    setAmounts((a) => ({ ...a, [key]: Number.isFinite(n) ? n : 0 }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await payrollApi.save(employeeId, year, month, { ...amounts, pfNumber, esiNumber, notes });
      if (!res.success) return notify(res.message || "Unable to save payslip", "error");
      setCurrent(res.data);
      notify("Payslip saved as draft", "success");
      loadHistory();
    } finally {
      setSaving(false);
    }
  };

  const finalize = async () => {
    setFinalizing(true);
    try {
      const res = await payrollApi.finalize(employeeId, year, month);
      if (!res.success) return notify(res.message || "Unable to finalize payslip", "error");
      setCurrent(res.data);
      notify("Payslip finalized — it can now be downloaded", "success");
      loadHistory();
    } finally {
      setFinalizing(false);
      setConfirmFinalize(false);
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      const res = await payrollApi.remove(employeeId, year, month);
      if (!res.success) return notify(res.message || "Unable to delete payslip", "error");
      setCurrent(null);
      setAmounts(EMPTY_AMOUNTS);
      setPfNumber("");
      setEsiNumber("");
      setNotes("");
      notify("Draft payslip deleted", "success");
      loadHistory();
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const years = useMemo(() => Array.from({ length: 6 }, (_, i) => now.getFullYear() - 4 + i), [now]);

  return (
    <div className="space-y-6 max-w-4xl">
      {isSelf && (
        <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
          <ShieldAlert className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>You&apos;re viewing your own record — payroll figures can&apos;t be self-edited, even by an Admin. Ask another Admin to manage this section for you.</span>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <select className={`${selectCls} w-auto`} value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {MONTH_NAMES.map((m, i) => (<option key={m} value={i + 1}>{m}</option>))}
            </select>
            <select className={`${selectCls} w-auto`} value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {years.map((y) => (<option key={y} value={y}>{y}</option>))}
            </select>
          </div>
          {isFinalized && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
              <Lock className="w-3 h-3" /> Finalized
            </span>
          )}
          {current && !isFinalized && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">Draft</span>
          )}
        </div>

        {periodLoading ? (
          <p className="text-sm text-slate-500 text-center py-8">Loading…</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Earnings</h4>
                <div className="space-y-2.5">
                  {EARNING_LINES.map((l) => (
                    <Field key={l.key} label={l.label}>
                      <input type="number" min={0} className={inputCls} value={amounts[l.key]} disabled={readOnly} onChange={(e) => setAmount(l.key, e.target.value)} />
                    </Field>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Deductions</h4>
                <div className="space-y-2.5">
                  {DEDUCTION_LINES.map((l) => (
                    <Field key={l.key} label={l.label}>
                      <input type="number" min={0} className={inputCls} value={amounts[l.key]} disabled={readOnly} onChange={(e) => setAmount(l.key, e.target.value)} />
                    </Field>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
              <Field label="PF / UAN Number" hint="Optional, printed on the slip">
                <input className={inputCls} value={pfNumber} disabled={readOnly} onChange={(e) => setPfNumber(e.target.value)} />
              </Field>
              <Field label="ESI Number" hint="Optional, printed on the slip">
                <input className={inputCls} value={esiNumber} disabled={readOnly} onChange={(e) => setEsiNumber(e.target.value)} />
              </Field>
              <Field label="Notes" hint="Optional, printed on the slip">
                <input className={inputCls} value={notes} disabled={readOnly} onChange={(e) => setNotes(e.target.value)} />
              </Field>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Gross Pay</div>
                <div className="text-lg font-bold text-slate-800 mt-0.5">{formatINR(grossPay)}</div>
              </div>
              <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Deductions</div>
                <div className="text-lg font-bold text-slate-800 mt-0.5">{formatINR(totalDeductions)}</div>
              </div>
              <div className="rounded-lg bg-slate-900 px-4 py-3">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">Net Pay</div>
                <div className="text-lg font-bold text-white mt-0.5">{formatINR(netPay)}</div>
              </div>
            </div>

            {isFinalized ? (
              <div className="flex items-center gap-3 mt-5">
                <a
                  href={payrollApi.pdfUrl(employeeId, year, month, true)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
                >
                  <Download className="w-4 h-4" /> Download Payslip
                </a>
              </div>
            ) : !isSelf ? (
              <div className="flex items-center gap-3 mt-5">
                <button type="button" onClick={save} disabled={saving} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
                  {saving ? "Saving…" : "Save Draft"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmFinalize(true)}
                  disabled={!current || finalizing}
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50"
                >
                  Finalize
                </button>
                {current && (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-rose-600 text-sm font-semibold hover:bg-rose-50 ml-auto"
                  >
                    <Trash2 className="w-4 h-4" /> Delete Draft
                  </button>
                )}
              </div>
            ) : null}
          </>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <h4 className="text-sm font-bold text-slate-800">Payslip History</h4>
        </div>
        {historyLoading ? (
          <p className="text-sm text-slate-500 text-center py-8">Loading…</p>
        ) : history.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">No payslips recorded yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {history.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <button type="button" onClick={() => { setMonth(p.month); setYear(p.year); }} className="text-left hover:underline">
                  <span className="font-semibold text-slate-800">{MONTH_NAMES[p.month - 1]} {p.year}</span>
                </button>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${p.status === "Finalized" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                  {p.status}
                </span>
                <span className="text-slate-600">{formatINR(p.netPay)}</span>
                {p.status === "Finalized" ? (
                  <a href={payrollApi.pdfUrl(employeeId, p.year, p.month, true)} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs font-semibold">
                    Download
                  </a>
                ) : (
                  <span className="text-xs text-slate-400">—</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        open={confirmFinalize}
        title="Finalize this payslip?"
        message="Once finalized, this payslip's figures are locked and it becomes downloadable. There is no way to un-finalize it — create a fresh period instead if something needs to change."
        confirmText="Finalize"
        tone="primary"
        loading={finalizing}
        onConfirm={finalize}
        onCancel={() => setConfirmFinalize(false)}
      />
      <ConfirmModal
        open={confirmDelete}
        title="Delete this draft payslip?"
        message="This removes the draft figures for this period. This cannot be undone."
        confirmText="Delete"
        tone="danger"
        loading={deleting}
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
