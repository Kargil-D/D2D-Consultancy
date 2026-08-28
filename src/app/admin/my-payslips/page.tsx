"use client";

import { useEffect, useState } from "react";
import { Download, Wallet } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import Breadcrumb from "@/components/admin/ui/Breadcrumb";
import { useToast } from "@/components/admin/ui/Toast";
import { payrollApi } from "@/lib/adminApi";
import type { AdminPayslip } from "@/types/admin";

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const formatINR = (v: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);

export default function MyPayslipsPage() {
  const { notify } = useToast();
  const [payslips, setPayslips] = useState<AdminPayslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await payrollApi.mine();
      if (res.success) setPayslips(res.data);
      else {
        setError(res.message || "Unable to load your payslips");
        notify(res.message || "Unable to load your payslips", "error");
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AdminShell title="My Payslips">
      <Breadcrumb items={[{ label: "My Payslips" }]} />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My Payslips</h1>
        <p className="text-sm text-slate-500 mt-0.5">Download your finalized monthly payslips.</p>
      </div>

      {error && !loading && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3 mb-6">{error}</div>
      )}

      {!error && (
        <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
          {loading ? (
            <p className="text-sm text-slate-500 text-center py-12">Loading…</p>
          ) : payslips.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-16 px-6">
              <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mb-3">
                <Wallet className="w-5 h-5 text-slate-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-700">No payslips yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">Once Admin finalizes a month&apos;s payroll, it will appear here for download.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {payslips.map((p) => (
                <div key={p.id} className="flex items-center justify-between px-5 py-4 text-sm">
                  <span className="font-semibold text-slate-800">{MONTH_NAMES[p.month - 1]} {p.year}</span>
                  <span className="text-slate-600">{formatINR(p.netPay)}</span>
                  <a
                    href={payrollApi.minePdfUrl(p.year, p.month, true)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </AdminShell>
  );
}
