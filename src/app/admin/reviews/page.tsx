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
import { Field, inputCls, textareaCls, selectCls } from "@/components/admin/ui/Field";
import { useToast } from "@/components/admin/ui/Toast";
import { destinationsApi, packagesApi, reviewsApi } from "@/lib/adminApi";
import type { AdminDestination, AdminPackage, AdminReview, Status } from "@/types/admin";

const PAGE_SIZE = 10;

const emptyForm = (): Partial<AdminReview> => ({
  customerName: "",
  customerImage: "",
  rating: 5,
  reviewText: "",
  taggedDestinationId: "",
  taggedPackageId: "",
  reviewDate: new Date().toISOString().slice(0, 10),
  isFeatured: false,
  status: "Active",
});

export default function ReviewsAdminPage() {
  const { notify } = useToast();
  const [rows, setRows] = useState<AdminReview[]>([]);
  const [destinations, setDestinations] = useState<AdminDestination[]>([]);
  const [packages, setPackages] = useState<AdminPackage[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [drawer, setDrawer] = useState<{ open: boolean; form: Partial<AdminReview> }>({ open: false, form: emptyForm() });
  const [confirm, setConfirm] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    const [list, d, p] = await Promise.all([
      reviewsApi.list({ search, page, pageSize: PAGE_SIZE }),
      destinationsApi.all(),
      packagesApi.all(),
    ]);
    setLoading(false);
    if (list.success) {
      setRows(list.data.items);
      setTotal(list.data.total);
    }
    if (d.success) setDestinations(d.data);
    if (p.success) setPackages(p.data);
  }, [search, page]);

  useEffect(() => { reload(); }, [reload]);

  const openCreate = () => setDrawer({ open: true, form: emptyForm() });
  const openEdit = (row: AdminReview) => setDrawer({ open: true, form: { ...row } });

  const save = async () => {
    const f = drawer.form;
    if (!f.customerName || !f.reviewText) return notify("Customer name and review text required", "error");
    if (f.id) await reviewsApi.update(f.id, f);
    else await reviewsApi.create(f as Omit<AdminReview, "id">);
    notify(f.id ? "Review updated" : "Review created");
    setDrawer({ open: false, form: emptyForm() });
    reload();
  };

  const remove = async () => {
    if (!confirm.id) return;
    await reviewsApi.remove(confirm.id);
    notify("Review deleted");
    setConfirm({ open: false, id: null });
    reload();
  };

  const toggleStatus = async (id: string) => { await reviewsApi.toggleStatus(id); reload(); };

  const columns: Column<AdminReview>[] = [
    {
      key: "customer",
      label: "Customer",
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-full overflow-hidden bg-slate-100 flex-shrink-0">
            {r.customerImage && <Image src={r.customerImage} alt={r.customerName} fill sizes="36px" className="object-cover" unoptimized />}
          </div>
          <div className="text-sm font-semibold text-slate-900">{r.customerName}</div>
        </div>
      ),
    },
    {
      key: "rating", label: "Rating",
      render: (r) => (
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? "text-amber-500 fill-amber-500" : "text-slate-300"}`} />
          ))}
        </div>
      ),
    },
    {
      key: "review", label: "Review",
      render: (r) => <div className="text-sm text-slate-600 max-w-md truncate">{r.reviewText}</div>,
    },
    { key: "reviewDate", label: "Date", render: (r) => r.reviewDate },
    {
      key: "featured", label: "Featured",
      render: (r) =>
        r.isFeatured ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
            <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> Yes
          </span>
        ) : (
          "—"
        ),
    },
    {
      key: "status", label: "Status",
      render: (r) => (
        <div className="flex items-center gap-2">
          <StatusToggle value={r.status} onChange={() => toggleStatus(r.id)} size="sm" />
          <StatusBadge status={r.status} />
        </div>
      ),
    },
    {
      key: "actions", label: "Actions", className: "text-right",
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <button onClick={() => openEdit(r)} className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"><Edit className="w-4 h-4" /></button>
          <button onClick={() => setConfirm({ open: true, id: r.id })} className="p-2 rounded-lg text-rose-600 hover:bg-rose-50"><Trash2 className="w-4 h-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <AdminShell title="Reviews">
      <Breadcrumb items={[{ label: "PM", href: "/admin/pm" }, { label: "Reviews" }]} />
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customer Reviews</h1>
          <p className="text-sm text-slate-500 mt-0.5">Testimonials shown in the homepage reviews section.</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 shadow-sm">
          <Plus className="w-4 h-4" /> Add Review
        </button>
      </div>

      <DataTable<AdminReview>
        columns={columns} rows={rows} loading={loading} rowKey={(r) => r.id}
        search={search} onSearchChange={(v) => { setPage(1); setSearch(v); }}
        searchPlaceholder="Search reviews…"
      />
      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />

      <Drawer
        open={drawer.open}
        title={drawer.form.id ? "Edit Review" : "New Review"}
        onClose={() => setDrawer({ open: false, form: emptyForm() })}
        width="lg"
        footer={
          <>
            <button onClick={() => setDrawer({ open: false, form: emptyForm() })} className="px-4 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100">Cancel</button>
            <button onClick={save} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700">{drawer.form.id ? "Update" : "Create"}</button>
          </>
        }
      >
        <ReviewFormBody form={drawer.form} destinations={destinations} packages={packages} onChange={(n) => setDrawer((d) => ({ ...d, form: { ...d.form, ...n } }))} />
      </Drawer>

      <ConfirmModal open={confirm.open} title="Delete review?" message="This review will be removed permanently."
        confirmText="Delete" onCancel={() => setConfirm({ open: false, id: null })} onConfirm={remove} />
    </AdminShell>
  );
}

function ReviewFormBody({
  form, destinations, packages, onChange,
}: {
  form: Partial<AdminReview>;
  destinations: AdminDestination[];
  packages: AdminPackage[];
  onChange: (n: Partial<AdminReview>) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Customer Name" required>
          <input className={inputCls} value={form.customerName ?? ""} onChange={(e) => onChange({ customerName: e.target.value })} />
        </Field>
        <Field label="Review Date">
          <input type="date" className={inputCls} value={form.reviewDate ?? ""} onChange={(e) => onChange({ reviewDate: e.target.value })} />
        </Field>
      </div>
      <Field label="Customer Image">
        <ImageUpload value={form.customerImage} onChange={(url) => onChange({ customerImage: url })} aspect="square" />
      </Field>
      <Field label="Rating">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => onChange({ rating: n })} className="p-1">
              <Star className={`w-7 h-7 ${n <= (form.rating ?? 0) ? "text-amber-500 fill-amber-500" : "text-slate-300"}`} />
            </button>
          ))}
        </div>
      </Field>
      <Field label="Review Text" required>
        <textarea className={textareaCls} value={form.reviewText ?? ""} onChange={(e) => onChange({ reviewText: e.target.value })} rows={4} />
      </Field>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Tagged Destination">
          <select className={selectCls} value={form.taggedDestinationId ?? ""} onChange={(e) => onChange({ taggedDestinationId: e.target.value })}>
            <option value="">— None —</option>
            {destinations.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </Field>
        <Field label="Tagged Package">
          <select className={selectCls} value={form.taggedPackageId ?? ""} onChange={(e) => onChange({ taggedPackageId: e.target.value })}>
            <option value="">— None —</option>
            {packages.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>
      </div>
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={!!form.isFeatured} onChange={(e) => onChange({ isFeatured: e.target.checked })} className="w-4 h-4 rounded" />
          Mark as featured
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
