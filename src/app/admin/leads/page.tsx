"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Edit, Eye } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import Breadcrumb from "@/components/admin/ui/Breadcrumb";
import DataTable, { type Column } from "@/components/admin/ui/DataTable";
import Pagination from "@/components/admin/ui/Pagination";
import { useToast } from "@/components/admin/ui/Toast";
import { LeadStatusBadge } from "@/components/admin/lead/LeadStatusBadge";
import { leadsApi, salesUsersApi } from "@/lib/adminApi";
import type { AdminLead, AdminSalesUser, LeadSource, LeadStatus } from "@/types/admin";

const PAGE_SIZE = 10;

const SOURCES: LeadSource[] = ["Website", "MetaAds", "GoogleAds", "SEO", "WhatsApp", "Referral", "Manual"];
const STATUSES: LeadStatus[] = ["New", "Contacted", "FollowUp", "QuotationSent", "PaymentPending", "Won", "Lost"];

const leadCode = (seq: number) => `LD-${seq.toString().padStart(4, "0")}`;

export default function LeadsAdminPage() {
  const { notify } = useToast();
  const [rows, setRows] = useState<AdminLead[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [source, setSource] = useState("");
  const [status, setStatus] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [salesUsers, setSalesUsers] = useState<AdminSalesUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    salesUsersApi.list().then((res) => {
      if (res.success) setSalesUsers(res.data);
    });
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await leadsApi.list({
        search,
        page,
        pageSize: PAGE_SIZE,
        filter: { source, status, assignedToId },
      });
      if (res.success) {
        setRows(res.data.items);
        setTotal(res.data.total);
      } else {
        notify(res.message || "Unable to load leads", "error");
      }
    } catch (error) {
      notify(error instanceof Error ? error.message : "Unable to load leads", "error");
    } finally {
      setLoading(false);
    }
  }, [search, page, source, status, assignedToId, notify]);

  useEffect(() => {
    reload();
  }, [reload]);

  const columns: Column<AdminLead>[] = [
    {
      key: "seq",
      label: "Lead ID",
      render: (r) => <span className="font-mono text-xs font-semibold text-slate-700">{leadCode(r.seq)}</span>,
    },
    {
      key: "customerName",
      label: "Customer",
      render: (r) => (
        <div>
          <div className="text-sm font-semibold text-slate-900">{r.customerName}</div>
          <div className="text-xs text-slate-500">{r.mobile}</div>
        </div>
      ),
    },
    { key: "destination", label: "Destination", render: (r) => r.destination?.name ?? "—" },
    {
      key: "travelDate",
      label: "Travel Date",
      render: (r) => (r.travelDate ? new Date(r.travelDate).toLocaleDateString("en-IN") : "—"),
    },
    {
      key: "source",
      label: "Source",
      render: (r) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          {r.source}
        </span>
      ),
    },
    {
      key: "assignedTo",
      label: "Assigned",
      render: (r) => (r.assignedTo ? `${r.assignedTo.firstName} ${r.assignedTo.lastName}` : "—"),
    },
    { key: "status", label: "Status", render: (r) => <LeadStatusBadge status={r.status} /> },
    {
      key: "actions",
      label: "Actions",
      className: "text-right",
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <Link href={`/admin/leads/${r.id}`} className="p-2 rounded-lg text-slate-600 hover:bg-slate-100" aria-label="View">
            <Eye className="w-4 h-4" />
          </Link>
          <Link href={`/admin/leads/${r.id}/edit`} className="p-2 rounded-lg text-slate-600 hover:bg-slate-100" aria-label="Edit">
            <Edit className="w-4 h-4" />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <AdminShell title="Leads">
      <Breadcrumb items={[{ label: "Sales", href: "/admin/sales" }, { label: "Leads" }]} />
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Leads</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            The working list of all enquiries from every source.
          </p>
        </div>
        <Link
          href="/admin/leads/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Lead
        </Link>
      </div>

      <DataTable<AdminLead>
        columns={columns}
        rows={rows}
        loading={loading}
        rowKey={(r) => r.id}
        search={search}
        onSearchChange={(v) => {
          setPage(1);
          setSearch(v);
        }}
        searchPlaceholder="Search by name, mobile, email…"
        toolbar={
          <div className="flex items-center gap-2">
            <select
              value={source}
              onChange={(e) => {
                setPage(1);
                setSource(e.target.value);
              }}
              className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white"
            >
              <option value="">All sources</option>
              {SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
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
            <select
              value={assignedToId}
              onChange={(e) => {
                setPage(1);
                setAssignedToId(e.target.value);
              }}
              className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white"
            >
              <option value="">All assignees</option>
              {salesUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName}
                </option>
              ))}
            </select>
          </div>
        }
      />
      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
    </AdminShell>
  );
}
