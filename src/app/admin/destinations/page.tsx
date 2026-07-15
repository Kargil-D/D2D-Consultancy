"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Plus, Edit, Trash2, Eye } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import Breadcrumb from "@/components/admin/ui/Breadcrumb";
import DataTable, { type Column } from "@/components/admin/ui/DataTable";
import Pagination from "@/components/admin/ui/Pagination";
import ConfirmModal from "@/components/admin/ui/ConfirmModal";
import StatusToggle, { StatusBadge } from "@/components/admin/ui/StatusToggle";
import { useToast } from "@/components/admin/ui/Toast";
import { destinationsApi } from "@/lib/adminApi";
import type { AdminDestination } from "@/types/admin";

const PAGE_SIZE = 10;

export default function DestinationsAdminPage() {
  const { notify } = useToast();
  const [rows, setRows] = useState<AdminDestination[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const [confirm, setConfirm] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await destinationsApi.list({
        search,
        page,
        pageSize: PAGE_SIZE,
        filter: country ? { country } : {},
      });
      if (res.success) {
        setRows(res.data.items);
        setTotal(res.data.total);
      } else {
        notify(res.message || "Unable to load destinations", "error");
      }
    } catch (error) {
      notify(error instanceof Error ? error.message : "Unable to load destinations", "error");
    } finally {
      setLoading(false);
    }
  }, [search, page, country, notify]);

  useEffect(() => {
    reload();
  }, [reload]);

  const countries = Array.from(new Set(rows.map((r) => r.country))).sort();

  const remove = async () => {
    if (!confirm.id) return;
    await destinationsApi.remove(confirm.id);
    notify("Destination deleted", "success");
    setConfirm({ open: false, id: null });
    reload();
  };

  const toggleStatus = async (id: string) => {
    await destinationsApi.toggleStatus(id);
    reload();
  };

  const columns: Column<AdminDestination>[] = [
    {
      key: "name",
      label: "Destination",
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-9 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
            {r.thumbnailImage && (
              <Image src={r.thumbnailImage} alt={r.name} fill sizes="48px" className="object-cover" unoptimized />
            )}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-900">{r.name}</div>
            <div className="text-xs text-slate-500">/{r.slug}</div>
          </div>
        </div>
      ),
    },
    { key: "country", label: "Country", render: (r) => r.country },
    { key: "state", label: "State", render: (r) => r.state || "—" },
    {
      key: "isPopular",
      label: "Popular",
      render: (r) => (r.isPopular ? "Yes" : "—"),
    },
    { key: "displayOrder", label: "Order", render: (r) => r.displayOrder },
    {
      key: "status",
      label: "Status",
      render: (r) => (
        <div className="flex items-center gap-2">
          <StatusToggle value={r.status} onChange={() => toggleStatus(r.id)} size="sm" />
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
          <Link href={`/admin/destinations/${r.id}/edit`} className="p-2 rounded-lg text-slate-600 hover:bg-slate-100" aria-label="Edit">
            <Edit className="w-4 h-4" />
          </Link>
          <a
            href={`/destinations/${r.slug}`}
            target="_blank"
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            aria-label="Preview"
          >
            <Eye className="w-4 h-4" />
          </a>
          <button onClick={() => setConfirm({ open: true, id: r.id })} className="p-2 rounded-lg text-rose-600 hover:bg-rose-50" aria-label="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <AdminShell title="Destinations">
      <Breadcrumb items={[{ label: "PM", href: "/admin/pm" }, { label: "Destinations" }]} />
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Destinations</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Drives the hero search dropdown, destination pages and the menu mega-grid.
          </p>
        </div>
        <Link
          href="/admin/destinations/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Destination
        </Link>
      </div>

      <DataTable<AdminDestination>
        columns={columns}
        rows={rows}
        loading={loading}
        rowKey={(r) => r.id}
        search={search}
        onSearchChange={(v) => {
          setPage(1);
          setSearch(v);
        }}
        searchPlaceholder="Search by name, country, state…"
        toolbar={
          <select
            value={country}
            onChange={(e) => {
              setPage(1);
              setCountry(e.target.value);
            }}
            className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white"
          >
            <option value="">All countries</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        }
      />
      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />

      <ConfirmModal
        open={confirm.open}
        title="Delete destination?"
        message="This will remove the destination from all listings. This action cannot be undone."
        confirmText="Delete"
        onCancel={() => setConfirm({ open: false, id: null })}
        onConfirm={remove}
      />
    </AdminShell>
  );
}
