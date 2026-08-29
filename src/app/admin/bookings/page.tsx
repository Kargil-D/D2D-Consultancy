"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Eye, Trash2 } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import Breadcrumb from "@/components/admin/ui/Breadcrumb";
import DataTable, { type Column } from "@/components/admin/ui/DataTable";
import Pagination from "@/components/admin/ui/Pagination";
import ConfirmModal from "@/components/admin/ui/ConfirmModal";
import { useToast } from "@/components/admin/ui/Toast";
import { useAuth } from "@/contexts/AuthContext";
import { canViewModule, type PermissionMap } from "@/lib/adminModules";
import { bookingsApi, salesUsersApi } from "@/lib/adminApi";
import type { AdminBooking, AdminSalesUser, BookingStatus } from "@/types/admin";

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
  const router = useRouter();
  const { notify } = useToast();
  const { user, loading: authLoading } = useAuth();
  const isAdmin = user?.roles.includes("admin") ?? false;
  const permissions = user?.permissions as PermissionMap | undefined;
  const canView = isAdmin || canViewModule(permissions, "Bookings");
  const [rows, setRows] = useState<AdminBooking[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [bookingExecutiveId, setBookingExecutiveId] = useState("");
  const [salesUsers, setSalesUsers] = useState<AdminSalesUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && user && !canView) router.replace("/admin");
  }, [authLoading, user, canView, router]);

  useEffect(() => {
    if (!isAdmin) return;
    // Matches BookingForm's own "Assign Operations Executive" picker (src/components/admin/BookingForm.tsx) — bookingExecutiveId is filled from the BookingExecutive role, not Sales.
    salesUsersApi.list("BookingExecutive").then((res) => {
      if (res.success) setSalesUsers(res.data);
    });
  }, [isAdmin]);

  const reload = useCallback(async () => {
    if (!canView) return;
    setLoading(true);
    try {
      const res = await bookingsApi.list({ search, status, bookingExecutiveId, page, pageSize: PAGE_SIZE });
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
  }, [search, status, bookingExecutiveId, page, notify, canView]);

  useEffect(() => {
    reload();
  }, [reload]);

  const remove = async () => {
    if (!confirm.id || deleting) return;
    setDeleting(true);
    try {
      const res = await bookingsApi.remove(confirm.id);
      if (!res.success) {
        notify(res.message || "Unable to delete booking", "error");
        return;
      }
      notify("Booking deleted", "success");
      setConfirm({ open: false, id: null });
      await reload();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Unable to delete booking", "error");
    } finally {
      setDeleting(false);
    }
  };

  if (!canView) return null;

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
          <button
            onClick={() => setConfirm({ open: true, id: r.id })}
            disabled={deleting}
            className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
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
        searchPlaceholder="Search by customer name, mobile, Booking ID, Lead ID, Quote ID…"
        toolbar={
          <div className="flex items-center gap-2">
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
            {isAdmin && (
              <select
                value={bookingExecutiveId}
                onChange={(e) => {
                  setPage(1);
                  setBookingExecutiveId(e.target.value);
                }}
                className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white"
              >
                <option value="">All assignees</option>
                {salesUsers.map((u) => (
                  <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                ))}
              </select>
            )}
          </div>
        }
      />
      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />

      <ConfirmModal
        open={confirm.open}
        title="Delete booking?"
        message="This will permanently remove this booking record, including its cost sheet, payments and documents from this view."
        confirmText="Delete"
        loading={deleting}
        onCancel={() => setConfirm({ open: false, id: null })}
        onConfirm={remove}
      />
    </AdminShell>
  );
}
