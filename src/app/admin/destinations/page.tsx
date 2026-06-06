"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Plus, Edit, Trash2, Eye } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import Breadcrumb from "@/components/admin/ui/Breadcrumb";
import DataTable, { type Column } from "@/components/admin/ui/DataTable";
import Pagination from "@/components/admin/ui/Pagination";
import Drawer from "@/components/admin/ui/Drawer";
import ConfirmModal from "@/components/admin/ui/ConfirmModal";
import StatusToggle, { StatusBadge } from "@/components/admin/ui/StatusToggle";
import ImageUpload from "@/components/admin/ui/ImageUpload";
import { Field, inputCls, textareaCls, selectCls } from "@/components/admin/ui/Field";
import { useToast } from "@/components/admin/ui/Toast";
import { destinationsApi } from "@/lib/adminApi";
import type { AdminDestination, Status } from "@/types/admin";
import { toSlug } from "@/utils/slug";

const PAGE_SIZE = 10;

const emptyForm = (): Partial<AdminDestination> => ({
  name: "",
  country: "",
  state: "",
  city: "",
  slug: "",
  shortDescription: "",
  fullDescription: "",
  thumbnailImage: "",
  bannerImage: "",
  isPopular: false,
  displayOrder: 0,
  seoTitle: "",
  seoDescription: "",
  status: "Active",
});

export default function DestinationsAdminPage() {
  const { notify } = useToast();
  const [rows, setRows] = useState<AdminDestination[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const [drawer, setDrawer] = useState<{ open: boolean; form: Partial<AdminDestination> }>({
    open: false,
    form: emptyForm(),
  });
  const [confirm, setConfirm] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    const res = await destinationsApi.list({
      search,
      page,
      pageSize: PAGE_SIZE,
      filter: country ? { country } : {},
    });
    setLoading(false);
    if (res.success) {
      setRows(res.data.items);
      setTotal(res.data.total);
    }
  }, [search, page, country]);

  useEffect(() => {
    reload();
  }, [reload]);

  const countries = Array.from(new Set(rows.map((r) => r.country))).sort();

  const openCreate = () => setDrawer({ open: true, form: emptyForm() });
  const openEdit = (row: AdminDestination) => setDrawer({ open: true, form: { ...row } });

  const save = async () => {
    const f = drawer.form;
    if (!f.name || !f.country) return notify("Name and country are required", "error");
    const payload: Partial<AdminDestination> = {
      ...f,
      slug: f.slug?.trim() || toSlug(f.name),
    };
    if (f.id) {
      const res = await destinationsApi.update(f.id, payload);
      if (res.success) notify("Destination updated");
    } else {
      const res = await destinationsApi.create(payload as Omit<AdminDestination, "id">);
      if (res.success) notify("Destination created");
    }
    setDrawer({ open: false, form: emptyForm() });
    reload();
  };

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
      render: (r) => (r.isPopular ? "? Yes" : "—"),
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
          <button onClick={() => openEdit(r)} className="p-2 rounded-lg text-slate-600 hover:bg-slate-100" aria-label="Edit">
            <Edit className="w-4 h-4" />
          </button>
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
      <Breadcrumb items={[{ label: "Destinations" }]} />
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Destinations</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Drives the hero search dropdown, destination pages and the menu mega-grid.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Destination
        </button>
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

      <Drawer
        open={drawer.open}
        title={drawer.form.id ? "Edit Destination" : "New Destination"}
        onClose={() => setDrawer({ open: false, form: emptyForm() })}
        width="xl"
        footer={
          <>
            <button onClick={() => setDrawer({ open: false, form: emptyForm() })} className="px-4 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100">
              Cancel
            </button>
            <button onClick={save} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700">
              {drawer.form.id ? "Update" : "Create"}
            </button>
          </>
        }
      >
        <DestinationFormBody
          form={drawer.form}
          onChange={(next) => setDrawer((d) => ({ ...d, form: { ...d.form, ...next } }))}
        />
      </Drawer>

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

function DestinationFormBody({
  form,
  onChange,
}: {
  form: Partial<AdminDestination>;
  onChange: (next: Partial<AdminDestination>) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Destination Name" required>
          <input className={inputCls} value={form.name ?? ""} onChange={(e) => onChange({ name: e.target.value })} placeholder="Bali" />
        </Field>
        <Field label="Slug URL" hint="Auto-generated from name if blank">
          <input className={inputCls} value={form.slug ?? ""} onChange={(e) => onChange({ slug: e.target.value })} placeholder="bali" />
        </Field>
        <Field label="Country" required>
          <input className={inputCls} value={form.country ?? ""} onChange={(e) => onChange({ country: e.target.value })} placeholder="Indonesia" />
        </Field>
        <Field label="State / Region">
          <input className={inputCls} value={form.state ?? ""} onChange={(e) => onChange({ state: e.target.value })} />
        </Field>
        <Field label="City">
          <input className={inputCls} value={form.city ?? ""} onChange={(e) => onChange({ city: e.target.value })} />
        </Field>
        <Field label="Display Order">
          <input type="number" className={inputCls} value={form.displayOrder ?? 0} onChange={(e) => onChange({ displayOrder: Number(e.target.value) })} />
        </Field>
      </div>

      <Field label="Short Description">
        <input className={inputCls} value={form.shortDescription ?? ""} onChange={(e) => onChange({ shortDescription: e.target.value })} placeholder="Island of paradise" />
      </Field>
      <Field label="Full Description">
        <textarea className={textareaCls} value={form.fullDescription ?? ""} onChange={(e) => onChange({ fullDescription: e.target.value })} />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Thumbnail Image">
          <ImageUpload value={form.thumbnailImage} onChange={(url) => onChange({ thumbnailImage: url })} aspect="4/3" />
        </Field>
        <Field label="Banner Image">
          <ImageUpload value={form.bannerImage} onChange={(url) => onChange({ bannerImage: url })} aspect="16/9" />
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="SEO Title">
          <input className={inputCls} value={form.seoTitle ?? ""} onChange={(e) => onChange({ seoTitle: e.target.value })} />
        </Field>
        <Field label="SEO Description">
          <input className={inputCls} value={form.seoDescription ?? ""} onChange={(e) => onChange({ seoDescription: e.target.value })} />
        </Field>
      </div>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={!!form.isPopular}
            onChange={(e) => onChange({ isPopular: e.target.checked })}
            className="w-4 h-4 rounded"
          />
          Mark as popular destination
        </label>
        <Field label="Status" className="!mb-0">
          <select className={selectCls} value={form.status ?? "Active"} onChange={(e) => onChange({ status: e.target.value as Status })}>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </Field>
      </div>
    </div>
  );
}
