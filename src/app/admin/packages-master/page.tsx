"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Plus, Edit, Trash2, Star } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import Breadcrumb from "@/components/admin/ui/Breadcrumb";
import DataTable, { type Column } from "@/components/admin/ui/DataTable";
import Pagination from "@/components/admin/ui/Pagination";
import Drawer from "@/components/admin/ui/Drawer";
import ConfirmModal from "@/components/admin/ui/ConfirmModal";
import StatusToggle, { StatusBadge } from "@/components/admin/ui/StatusToggle";
import ImageUpload from "@/components/admin/ui/ImageUpload";
import TagInput from "@/components/admin/ui/TagInput";
import { Field, inputCls, textareaCls, selectCls } from "@/components/admin/ui/Field";
import { useToast } from "@/components/admin/ui/Toast";
import { destinationsApi, packagesApi } from "@/lib/adminApi";
import type { AdminDestination, AdminPackage, Status, TravelType } from "@/types/admin";
import { toSlug } from "@/utils/slug";

const PAGE_SIZE = 10;

const TRAVEL_TYPES: TravelType[] = ["Family", "Honeymoon", "Adventure", "Group", "Solo"];

const emptyForm = (): Partial<AdminPackage> => ({
  name: "",
  destinationId: "",
  packageType: "Standard",
  days: 5,
  nights: 4,
  startingPrice: 0,
  offerPrice: 0,
  thumbnail: "",
  coverBanner: "",
  shortDescription: "",
  highlights: [],
  inclusions: [],
  exclusions: [],
  bestTimeToVisit: "",
  travelTypes: [],
  isFeatured: false,
  isRecentlyViewed: false,
  isHeroCampaign: false,
  viewDetailsRedirect: "",
  slug: "",
  seoTitle: "",
  seoDescription: "",
  status: "Active",
  gallery: [],
});

export default function PackagesMasterPage() {
  const { notify } = useToast();
  const [rows, setRows] = useState<AdminPackage[]>([]);
  const [destinations, setDestinations] = useState<AdminDestination[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [destFilter, setDestFilter] = useState("");
  const [travelTypeFilter, setTravelTypeFilter] = useState("");
  const [drawer, setDrawer] = useState<{ open: boolean; form: Partial<AdminPackage> }>({
    open: false,
    form: emptyForm(),
  });
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

  const openCreate = () => setDrawer({ open: true, form: emptyForm() });
  const openEdit = (row: AdminPackage) => setDrawer({ open: true, form: { ...row } });

  const save = async () => {
    const f = drawer.form;
    if (!f.name || !f.destinationId) return notify("Name and destination are required", "error");
    const payload: Partial<AdminPackage> = {
      ...f,
      slug: f.slug?.trim() || toSlug(f.name),
      viewDetailsRedirect: f.viewDetailsRedirect?.trim() || `/packages/${f.slug || toSlug(f.name)}`,
    };
    if (f.id) {
      await packagesApi.update(f.id, payload);
      notify("Package updated");
    } else {
      await packagesApi.create(payload as Omit<AdminPackage, "id">);
      notify("Package created");
    }
    setDrawer({ open: false, form: emptyForm() });
    reload();
  };

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
          <div className="text-sm font-semibold text-slate-900">?{(r.offerPrice || r.startingPrice).toLocaleString("en-IN")}</div>
          {(r.offerPrice ?? 0) > 0 && r.startingPrice > (r.offerPrice ?? 0) && (
            <div className="text-xs text-slate-400 line-through">?{r.startingPrice.toLocaleString("en-IN")}</div>
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
          <button onClick={() => openEdit(r)} className="p-2 rounded-lg text-slate-600 hover:bg-slate-100" aria-label="Edit">
            <Edit className="w-4 h-4" />
          </button>
          <button onClick={() => setConfirm({ open: true, id: r.id })} className="p-2 rounded-lg text-rose-600 hover:bg-rose-50" aria-label="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <AdminShell title="Campaigns Master">
      <Breadcrumb items={[{ label: "Campaigns Master" }]} />
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Campaigns</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Drives the campaigns landing page, hero campaigns, and view-details redirects.
          </p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 shadow-sm">
          <Plus className="w-4 h-4" /> Add Campaign
        </button>
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

      <Drawer
        open={drawer.open}
        title={drawer.form.id ? "Edit Campaign" : "New Campaign"}
        onClose={() => setDrawer({ open: false, form: emptyForm() })}
        width="xl"
        footer={
          <>
            <button onClick={() => setDrawer({ open: false, form: emptyForm() })} className="px-4 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100">Cancel</button>
            <button onClick={save} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700">
              {drawer.form.id ? "Update" : "Create"}
            </button>
          </>
        }
      >
        <PackageFormBody form={drawer.form} destinations={destinations} onChange={(n) => setDrawer((d) => ({ ...d, form: { ...d.form, ...n } }))} />
      </Drawer>

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

function PackageFormBody({
  form,
  destinations,
  onChange,
}: {
  form: Partial<AdminPackage>;
  destinations: AdminDestination[];
  onChange: (next: Partial<AdminPackage>) => void;
}) {
  const toggleTravelType = (t: TravelType) => {
    const cur = form.travelTypes ?? [];
    onChange({ travelTypes: cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t] });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Package Name" required>
          <input className={inputCls} value={form.name ?? ""} onChange={(e) => onChange({ name: e.target.value })} />
        </Field>
        <Field label="Destination" required>
          <select className={selectCls} value={form.destinationId ?? ""} onChange={(e) => onChange({ destinationId: e.target.value })}>
            <option value="">Select destination</option>
            {destinations.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Package Type">
          <input className={inputCls} value={form.packageType ?? ""} onChange={(e) => onChange({ packageType: e.target.value })} placeholder="Standard / Premium / Luxury" />
        </Field>
        <Field label="Slug">
          <input className={inputCls} value={form.slug ?? ""} onChange={(e) => onChange({ slug: e.target.value })} />
        </Field>
        <Field label="Days">
          <input type="number" className={inputCls} value={form.days ?? 0} onChange={(e) => onChange({ days: Number(e.target.value) })} />
        </Field>
        <Field label="Nights">
          <input type="number" className={inputCls} value={form.nights ?? 0} onChange={(e) => onChange({ nights: Number(e.target.value) })} />
        </Field>
        <Field label="Starting Price (?)">
          <input type="number" className={inputCls} value={form.startingPrice ?? 0} onChange={(e) => onChange({ startingPrice: Number(e.target.value) })} />
        </Field>
        <Field label="Offer Price (?)">
          <input type="number" className={inputCls} value={form.offerPrice ?? 0} onChange={(e) => onChange({ offerPrice: Number(e.target.value) })} />
        </Field>
        <Field label="Best Time to Visit">
          <input className={inputCls} value={form.bestTimeToVisit ?? ""} onChange={(e) => onChange({ bestTimeToVisit: e.target.value })} />
        </Field>
        <Field label="View Details Redirect" hint="Defaults to /packages/{slug}">
          <input className={inputCls} value={form.viewDetailsRedirect ?? ""} onChange={(e) => onChange({ viewDetailsRedirect: e.target.value })} />
        </Field>
      </div>

      <Field label="Short Description">
        <textarea className={textareaCls} value={form.shortDescription ?? ""} onChange={(e) => onChange({ shortDescription: e.target.value })} />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Thumbnail Image">
          <ImageUpload value={form.thumbnail} onChange={(url) => onChange({ thumbnail: url })} aspect="4/3" />
        </Field>
        <Field label="Cover Banner">
          <ImageUpload value={form.coverBanner} onChange={(url) => onChange({ coverBanner: url })} aspect="16/9" />
        </Field>
      </div>

      <Field label="Travel Types">
        <div className="flex flex-wrap gap-2">
          {TRAVEL_TYPES.map((t) => {
            const active = form.travelTypes?.includes(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => toggleTravelType(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                  active ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:border-blue-400"
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="Highlights">
          <TagInput value={form.highlights ?? []} onChange={(v) => onChange({ highlights: v })} placeholder="Sunset cruise" />
        </Field>
        <Field label="Inclusions">
          <TagInput value={form.inclusions ?? []} onChange={(v) => onChange({ inclusions: v })} placeholder="All meals" />
        </Field>
        <Field label="Exclusions">
          <TagInput value={form.exclusions ?? []} onChange={(v) => onChange({ exclusions: v })} placeholder="Visa fees" />
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={!!form.isFeatured} onChange={(e) => onChange({ isFeatured: e.target.checked })} className="w-4 h-4 rounded" />
          Featured Package
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={!!form.isRecentlyViewed} onChange={(e) => onChange({ isRecentlyViewed: e.target.checked })} className="w-4 h-4 rounded" />
          Show in Recently Viewed
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={!!form.isHeroCampaign} onChange={(e) => onChange({ isHeroCampaign: e.target.checked })} className="w-4 h-4 rounded" />
          Show in Hero Campaigns
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="SEO Title">
          <input className={inputCls} value={form.seoTitle ?? ""} onChange={(e) => onChange({ seoTitle: e.target.value })} />
        </Field>
        <Field label="SEO Description">
          <input className={inputCls} value={form.seoDescription ?? ""} onChange={(e) => onChange({ seoDescription: e.target.value })} />
        </Field>
      </div>

      <Field label="Status">
        <select className={selectCls} value={form.status ?? "Active"} onChange={(e) => onChange({ status: e.target.value as Status })}>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </Field>
    </div>
  );
}
