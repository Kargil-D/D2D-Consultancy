"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Plus, Edit, Trash2, Star } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import Breadcrumb from "@/components/admin/ui/Breadcrumb";
import DataTable, { type Column } from "@/components/admin/ui/DataTable";
import Pagination from "@/components/admin/ui/Pagination";
import ConfirmModal from "@/components/admin/ui/ConfirmModal";
import StatusToggle, { StatusBadge } from "@/components/admin/ui/StatusToggle";
import { useToast } from "@/components/admin/ui/Toast";
import { destinationsApi, packagesApi } from "@/lib/adminApi";
import type { AdminDestination, AdminPackage, TravelType } from "@/types/admin";

const PAGE_SIZE = 10;

const TRAVEL_TYPES: TravelType[] = ["Family", "Honeymoon", "Adventure", "Group", "Solo"];

export default function PackagesMasterPage() {
  const { notify } = useToast();
  const [rows, setRows] = useState<AdminPackage[]>([]);
  const [destinations, setDestinations] = useState<AdminDestination[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [destFilter, setDestFilter] = useState("");
  const [travelTypeFilter, setTravelTypeFilter] = useState("");
  const [confirm, setConfirm] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    const [pkg, dest] = await Promise.all([
      packagesApi.list({
        search,
        page,
        pageSize: PAGE_SIZE,
        filter: destFilter ? { destinationId: destFilter } : {},
      }),
      destinationsApi.all(),
    ]);
    setLoading(false);
    if (pkg.success) {
      let items = pkg.data.items;
      if (travelTypeFilter) {
        items = items.filter((p) => p.travelTypes.includes(travelTypeFilter as TravelType));
      }
      setRows(items);
      setTotal(pkg.data.total);
    }
    if (dest.success) setDestinations(dest.data);
  }, [search, page, destFilter, travelTypeFilter]);

  useEffect(() => {
    reload();
  }, [reload]);

  const destName = (id: string) => destinations.find((d) => d.id === id)?.name ?? "—";

  const remove = async () => {
    if (!confirm.id) return;
    await packagesApi.remove(confirm.id);
    notify("Package deleted");
    setConfirm({ open: false, id: null });
    reload();
  };

  const toggleStatus = async (id: string) => {
    await packagesApi.toggleStatus(id);
    reload();
  };

  const columns: Column<AdminPackage>[] = [
    {
      key: "name",
      label: "Package",
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-9 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
            {r.thumbnail && <Image src={r.thumbnail} alt={r.name} fill sizes="48px" className="object-cover" unoptimized />}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-900 flex items-center gap-1">
              {r.name}
              {r.isFeatured && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}
            </div>
            <div className="text-xs text-slate-500">/{r.slug}</div>
          </div>
        </div>
      ),
    },
    { key: "destination", label: "Destination", render: (r) => destName(r.destinationId) },
    { key: "duration", label: "Duration", render: (r) => `${r.days}D / ${r.nights}N` },
    {
      key: "price",
      label: "Price",
      render: (r) => (
        <div>
          <div className="text-sm font-semibold text-slate-900">INR {(r.offerPrice || r.startingPrice).toLocaleString("en-IN")}</div>
          {(r.offerPrice ?? 0) > 0 && r.startingPrice > (r.offerPrice ?? 0) && (
            <div className="text-xs text-slate-400 line-through">INR {r.startingPrice.toLocaleString("en-IN")}</div>
          )}
        </div>
      ),
    },
    {
      key: "flags",
      label: "Flags",
      render: (r) => (
        <div className="flex gap-1 flex-wrap">
          {r.isHeroCampaign && <Pill color="cyan">Hero</Pill>}
          {r.isFeatured && <Pill color="amber">Featured</Pill>}
          {r.isRecentlyViewed && <Pill color="violet">Recent</Pill>}
        </div>
      ),
    },
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
          <Link href={`/admin/packages-master/${r.id}/edit`} className="p-2 rounded-lg text-slate-600 hover:bg-slate-100" aria-label="Edit">
            <Edit className="w-4 h-4" />
          </Link>
          <button onClick={() => setConfirm({ open: true, id: r.id })} className="p-2 rounded-lg text-rose-600 hover:bg-rose-50" aria-label="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <AdminShell title="Campaigns Master">
      <Breadcrumb items={[{ label: "PM", href: "/admin/pm" }, { label: "Campaigns Master" }]} />
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Campaigns</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Drives the campaigns landing page, hero campaigns, and view-details redirects.
          </p>
        </div>
        <Link href="/admin/packages-master/new" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 shadow-sm">
          <Plus className="w-4 h-4" /> Add Campaign
        </Link>
      </div>

      <DataTable<AdminPackage>
        columns={columns}
        rows={rows}
        loading={loading}
        rowKey={(r) => r.id}
        search={search}
        onSearchChange={(v) => {
          setPage(1);
          setSearch(v);
        }}
        searchPlaceholder="Search campaigns…"
        toolbar={
          <>
            <select value={destFilter} onChange={(e) => { setPage(1); setDestFilter(e.target.value); }} className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white">
              <option value="">All destinations</option>
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <select value={travelTypeFilter} onChange={(e) => setTravelTypeFilter(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white">
              <option value="">All travel types</option>
              {TRAVEL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </>
        }
      />
      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />

      <ConfirmModal
        open={confirm.open}
        title="Delete campaign?"
        message="This will remove the campaign from all listings."
        confirmText="Delete"
        onCancel={() => setConfirm({ open: false, id: null })}
        onConfirm={remove}
      />
    </AdminShell>
  );
}

function Pill({ children, color }: { children: React.ReactNode; color: "cyan" | "amber" | "violet" }) {
  const cls = {
    cyan: "bg-cyan-50 text-cyan-700 border-cyan-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    violet: "bg-violet-50 text-violet-700 border-violet-200",
  }[color];
  return <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-semibold ${cls}`}>{children}</span>;
}
