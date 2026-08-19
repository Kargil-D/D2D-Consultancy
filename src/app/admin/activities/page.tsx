"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Plus, Edit, Trash2, ImageIcon } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import Breadcrumb from "@/components/admin/ui/Breadcrumb";
import DataTable, { type Column } from "@/components/admin/ui/DataTable";
import Pagination from "@/components/admin/ui/Pagination";
import ConfirmModal from "@/components/admin/ui/ConfirmModal";
import StatusToggle, { StatusBadge } from "@/components/admin/ui/StatusToggle";
import { useToast } from "@/components/admin/ui/Toast";
import { activitiesApi, citiesApi, destinationsApi } from "@/lib/adminApi";
import type { AdminActivity, AdminCity, AdminDestination } from "@/types/admin";

const PAGE_SIZE = 10;

export default function ActivitiesAdminPage() {
  const { notify } = useToast();
  const [rows, setRows] = useState<AdminActivity[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [cityId, setCityId] = useState("");
  const [status, setStatus] = useState("");
  const [destinations, setDestinations] = useState<AdminDestination[]>([]);
  const [allCities, setAllCities] = useState<AdminCity[]>([]);
  const [confirm, setConfirm] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    destinationsApi.all().then((res) => {
      if (res.success) setDestinations(res.data);
    });
    citiesApi.list({ pageSize: 1000 }).then((res) => {
      if (res.success) setAllCities(res.data.items);
    });
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await activitiesApi.list({
        search,
        page,
        pageSize: PAGE_SIZE,
        filter: { destinationId, cityId, status },
      });
      if (res.success) {
        setRows(res.data.items);
        setTotal(res.data.total);
      } else {
        notify(res.message || "Unable to load activities", "error");
      }
    } catch (error) {
      notify(error instanceof Error ? error.message : "Unable to load activities", "error");
    } finally {
      setLoading(false);
    }
  }, [search, page, destinationId, cityId, status, notify]);

  useEffect(() => {
    reload();
  }, [reload]);

  const cityFilterOptions = destinationId
    ? (destinations.find((d) => d.id === destinationId)?.cities ?? [])
    : allCities;

  const remove = async () => {
    if (!confirm.id || deleting) return;
    setDeleting(true);
    try {
      const res = await activitiesApi.remove(confirm.id);
      if (!res.success) {
        notify(res.message || "Unable to delete activity", "error");
        return;
      }
      notify("Activity deleted", "success");
      setConfirm({ open: false, id: null });
      await reload();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Unable to delete activity", "error");
    } finally {
      setDeleting(false);
    }
  };

  const toggleStatus = async (id: string) => {
    if (togglingId) return;
    setTogglingId(id);
    try {
      const res = await activitiesApi.toggleStatus(id);
      if (!res.success) {
        notify(res.message || "Unable to update status", "error");
        return;
      }
      notify("Status updated", "success");
      await reload();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Unable to update status", "error");
    } finally {
      setTogglingId(null);
    }
  };

  const columns: Column<AdminActivity>[] = [
    {
      key: "name",
      label: "Activity Name",
      render: (r) => <div className="text-sm font-semibold text-slate-900">{r.name}</div>,
    },
    { key: "destination", label: "Destination", render: (r) => r.destination?.name ?? "—" },
    {
      key: "cities",
      label: "City",
      render: (r) => (r.cities?.length ? r.cities.map((c) => c.name).join(", ") : "—"),
    },
    {
      key: "imageUrl",
      label: "Image",
      render: (r) => (
        <div className="relative w-12 h-9 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
          {r.imageUrl ? (
            <Image src={r.imageUrl} alt={r.name} fill sizes="48px" className="object-cover" unoptimized />
          ) : (
            <ImageIcon className="w-4 h-4 text-slate-400" />
          )}
        </div>
      ),
    },
    {
      key: "description",
      label: "Description",
      render: (r) => <div className="max-w-xs truncate text-slate-600">{r.description}</div>,
    },
    {
      key: "status",
      label: "Status",
      render: (r) => (
        <div className="flex items-center gap-2">
          <StatusToggle value={r.status} onChange={() => toggleStatus(r.id)} size="sm" loading={togglingId === r.id} />
          <StatusBadge status={r.status} />
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      className: "text-right",
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <Link href={`/admin/activities/${r.id}/edit`} className="p-2 rounded-lg text-slate-600 hover:bg-slate-100" aria-label="Edit">
            <Edit className="w-4 h-4" />
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
    <AdminShell title="Activities">
      <Breadcrumb items={[{ label: "PM", href: "/admin/pm" }, { label: "Activities" }]} />
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Activities</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Reusable activity catalog — selected later when building a quotation, package or itinerary.
          </p>
        </div>
        <Link
          href="/admin/activities/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Activity
        </Link>
      </div>

      <DataTable<AdminActivity>
        columns={columns}
        rows={rows}
        loading={loading}
        rowKey={(r) => r.id}
        search={search}
        onSearchChange={(v) => {
          setPage(1);
          setSearch(v);
        }}
        searchPlaceholder="Search by activity name, city, destination…"
        toolbar={
          <div className="flex items-center gap-2">
            <select
              value={destinationId}
              onChange={(e) => {
                setPage(1);
                setDestinationId(e.target.value);
                setCityId("");
              }}
              className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white"
            >
              <option value="">All destinations</option>
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <select
              value={cityId}
              onChange={(e) => {
                setPage(1);
                setCityId(e.target.value);
              }}
              className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white"
            >
              <option value="">All cities</option>
              {cityFilterOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
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
              <option value="">Active/Inactive</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        }
      />
      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />

      <ConfirmModal
        open={confirm.open}
        title="Delete activity?"
        message="This will remove the activity from the catalog. This action cannot be undone."
        confirmText="Delete"
        loading={deleting}
        onCancel={() => setConfirm({ open: false, id: null })}
        onConfirm={remove}
      />
    </AdminShell>
  );
}
