"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Edit } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import Breadcrumb from "@/components/admin/ui/Breadcrumb";
import DataTable, { type Column } from "@/components/admin/ui/DataTable";
import Pagination from "@/components/admin/ui/Pagination";
import { useToast } from "@/components/admin/ui/Toast";
import { quotationsApi } from "@/lib/adminApi";
import type { AdminQuotation, QuotationStatus } from "@/types/admin";

const PAGE_SIZE = 10;
const STATUSES: QuotationStatus[] = ["Draft", "Sent", "Accepted", "Rejected", "Expired"];

const quoteCode = (seq: number) => `QT-${seq.toString().padStart(4, "0")}`;
const formatINR = (v: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", currencyDisplay: "code", maximumFractionDigits: 0 }).format(v);

export default function QuotationsAdminPage() {
  const { notify } = useToast();
  const [rows, setRows] = useState<AdminQuotation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await quotationsApi.list({ search, status, page, pageSize: PAGE_SIZE });
      if (res.success) {
        setRows(res.data.items);
        setTotal(res.data.total);
      } else {
        notify(res.message || "Unable to load quotations", "error");
      }
    } catch (error) {
      notify(error instanceof Error ? error.message : "Unable to load quotations", "error");
    } finally {
      setLoading(false);
    }
  }, [search, status, page, notify]);

  useEffect(() => {
    reload();
  }, [reload]);

  const columns: Column<AdminQuotation>[] = [
    {
      key: "seq",
      label: "Quote ID",
      render: (r) => <span className="font-mono text-xs font-semibold text-slate-700">{quoteCode(r.seq)}</span>,
    },
    {
      key: "customer",
      label: "Customer",
      render: (r) => (
        <div>
          <div className="text-sm font-semibold text-slate-900">{r.lead?.customerName ?? "—"}</div>
          <div className="text-xs text-slate-500">{r.lead?.mobile}</div>
        </div>
      ),
    },
    { key: "destination", label: "Destination", render: (r) => r.destination?.name ?? "—" },
    {
      key: "sellingPrice",
      label: "Selling Price",
      render: (r) => {
        const totalCost = r.items.reduce((sum, i) => sum + i.qty * i.cost, 0);
        const sellingPrice = totalCost + Math.round(totalCost * (r.marginPercent / 100));
        return <span className="font-semibold text-slate-900">{formatINR(sellingPrice)}</span>;
      },
    },
    {
      key: "status",
      label: "Status",
      render: (r) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          {r.status}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      className: "text-right",
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <Link href={`/admin/quotations/${r.id}/edit`} className="p-2 rounded-lg text-slate-600 hover:bg-slate-100" aria-label="Edit">
            <Edit className="w-4 h-4" />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <AdminShell title="Quotations">
      <Breadcrumb items={[{ label: "Sales", href: "/admin/sales" }, { label: "Quotations" }]} />
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quotations</h1>
          <p className="text-sm text-slate-500 mt-0.5">All quotations raised across every lead.</p>
        </div>
        <Link
          href="/admin/leads"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 shadow-sm"
        >
          Create from a Lead
        </Link>
      </div>

      <DataTable<AdminQuotation>
        columns={columns}
        rows={rows}
        loading={loading}
        rowKey={(r) => r.id}
        search={search}
        onSearchChange={(v) => {
          setPage(1);
          setSearch(v);
        }}
        searchPlaceholder="Search by customer name, mobile…"
        toolbar={
          <select
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
            className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white"
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        }
      />
      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
    </AdminShell>
  );
}
