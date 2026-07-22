"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Edit, Eye } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import Breadcrumb from "@/components/admin/ui/Breadcrumb";
import DataTable, { type Column } from "@/components/admin/ui/DataTable";
import Pagination from "@/components/admin/ui/Pagination";
import { useToast } from "@/components/admin/ui/Toast";
import { bookingsApi } from "@/lib/adminApi";
import type { AdminBooking, BookingStatus } from "@/types/admin";

const PAGE_SIZE = 10;
const STATUSES: BookingStatus[] = ["Won", "Booked", "OnTrip", "Completed", "Cancelled"];

const bookingCode = (seq: number) => `BK-${seq.toString().padStart(4, "0")}`;

const STATUS_STYLES: Record<BookingStatus, string> = {
  Won: "bg-slate-100 text-slate-700 border-slate-200",
  Booked: "bg-cyan-50 text-cyan-700 border-cyan-200",
  OnTrip: "bg-amber-50 text-amber-700 border-amber-200",
  Completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Cancelled: "bg-rose-50 text-rose-700 border-rose-200",
};

export default function BookingsAdminPage() {
  const { notify } = useToast();
  const [rows, setRows] = useState<AdminBooking[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await bookingsApi.list({ search, status, page, pageSize: PAGE_SIZE });
      if (res.success) {
        setRows(res.data.items);
        setTotal(res.data.total);
      } else {
        notify(res.message || "Unable to load bookings", "error");
      }
    } catch (error) {
      notify(error instanceof Error ? error.message : "Unable to load bookings", "error");
    } finally {
      setLoading(false);
    }
  }, [search, status, page, notify]);

  useEffect(() => {
    reload();
  }, [reload]);

  const columns: Column<AdminBooking>[] = [
    {
      key: "seq",
      label: "Booking ID",
      render: (r) => <span className="font-mono text-xs font-semibold text-slate-700">{bookingCode(r.seq)}</span>,
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
      key: "travelDate",
      label: "Travel Date",
      render: (r) => (r.travelDate ? new Date(r.travelDate).toLocaleDateString("en-IN") : "—"),
    },
    {
      key: "be",
      label: "BE",
      render: (r) => (r.bookingExecutive ? `${r.bookingExecutive.firstName} ${r.bookingExecutive.lastName}` : "—"),
    },
    {
      key: "status",
      label: "Status",
      render: (r) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_STYLES[r.status]}`}>
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
          <Link href={`/admin/bookings/${r.id}`} className="p-2 rounded-lg text-slate-600 hover:bg-slate-100" aria-label="View">
            <Eye className="w-4 h-4" />
          </Link>
          <Link href={`/admin/bookings/${r.id}/edit`} className="p-2 rounded-lg text-slate-600 hover:bg-slate-100" aria-label="Edit">
            <Edit className="w-4 h-4" />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <AdminShell title="Bookings">
      <Breadcrumb items={[{ label: "Bookings" }]} />
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bookings</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            All bookings, most created automatically when a lead is marked Won.
          </p>
        </div>
        <Link
          href="/admin/bookings/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Booking
        </Link>
      </div>

      <DataTable<AdminBooking>
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
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        }
      />
      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
    </AdminShell>
  );
}
