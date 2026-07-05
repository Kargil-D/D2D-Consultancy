"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import Breadcrumb from "@/components/admin/ui/Breadcrumb";
import DataTable, { type Column } from "@/components/admin/ui/DataTable";
import Pagination from "@/components/admin/ui/Pagination";
import Drawer from "@/components/admin/ui/Drawer";
import ConfirmModal from "@/components/admin/ui/ConfirmModal";
import StatusToggle, { StatusBadge } from "@/components/admin/ui/StatusToggle";
import { Field, selectCls } from "@/components/admin/ui/Field";
import { useToast } from "@/components/admin/ui/Toast";
import { hotelsApi, packagesApi } from "@/lib/adminApi";
import type { AdminHotel, AdminPackage, Status } from "@/types/admin";
import HotelStaysEditor from "@/components/admin/hotel/HotelStaysEditor";

const PAGE_SIZE = 10;

const emptyForm = (): Partial<AdminHotel> => ({
  packageId: "",
  hotels: [],
  status: "Active",
});

export default function HotelsAdminPage() {
  const { notify } = useToast();
  const [rows, setRows] = useState<AdminHotel[]>([]);
  const [packages, setPackages] = useState<AdminPackage[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [drawer, setDrawer] = useState<{ open: boolean; form: Partial<AdminHotel> }>({
    open: false,
    form: emptyForm(),
  });
  const [confirm, setConfirm] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    const [list, pkg] = await Promise.all([
      hotelsApi.list({ page, pageSize: PAGE_SIZE }),
      packagesApi.all(),
    ]);
    setLoading(false);
    if (list.success) {
      setRows(list.data.items);
      setTotal(list.data.total);
    }
    if (pkg.success) setPackages(pkg.data);
  }, [page]);

  useEffect(() => { reload(); }, [reload]);

  const packageName = (id: string) => packages.find((p) => p.id === id)?.name ?? "—";

  const openCreate = () => setDrawer({ open: true, form: emptyForm() });
  const openEdit = (row: AdminHotel) => setDrawer({ open: true, form: { ...row } });

  const setForm = (patch: Partial<AdminHotel>) =>
    setDrawer((d) => ({ ...d, form: { ...d.form, ...patch } }));

  const save = async () => {
    const f = drawer.form;
    if (!f.packageId) return notify("Linked package is required", "error");
    if (f.id) {
      await hotelsApi.update(f.id, f);
      notify("Hotels updated");
    } else {
      await hotelsApi.create(f as Omit<AdminHotel, "id">);
      notify("Hotels created");
    }
    setDrawer({ open: false, form: emptyForm() });
    reload();
  };

  const remove = async () => {
    if (!confirm.id) return;
    await hotelsApi.remove(confirm.id);
    notify("Hotel plan deleted");
    setConfirm({ open: false, id: null });
    reload();
  };

  const toggleStatus = async (id: string) => {
    await hotelsApi.toggleStatus(id);
    reload();
  };

  const columns: Column<AdminHotel>[] = [
    { key: "packageId", label: "Linked Package", render: (r) => <div className="font-semibold text-slate-900 text-sm">{packageName(r.packageId)}</div> },
    { key: "hotels", label: "Hotels", render: (r) => `${r.hotels?.length ?? 0} hotel(s)` },
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
    <AdminShell title="Hotels">
      <Breadcrumb items={[{ label: "PM", href: "/admin/pm" }, { label: "Hotels" }]} />
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hotels</h1>
          <p className="text-sm text-slate-500 mt-0.5">Hotel stays per campaign. Linked to packages.</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 shadow-sm">
          <Plus className="w-4 h-4" /> Add Hotel Plan
        </button>
      </div>

      <DataTable<AdminHotel>
        columns={columns} rows={rows} loading={loading} rowKey={(r) => r.id}
      />
      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />

      <Drawer
        open={drawer.open}
        title={drawer.form.id ? "Edit Hotels" : "New Hotel Plan"}
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
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Linked Package" required>
              <select className={selectCls} value={drawer.form.packageId ?? ""} onChange={(e) => setForm({ packageId: e.target.value })}>
                <option value="">Select package</option>
                {packages.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select className={selectCls} value={drawer.form.status ?? "Active"} onChange={(e) => setForm({ status: e.target.value as Status })}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </Field>
          </div>
          <HotelStaysEditor hotels={drawer.form.hotels ?? []} onChange={(hotels) => setForm({ hotels })} />
        </div>
      </Drawer>

      <ConfirmModal
        open={confirm.open} title="Delete hotel plan?" message="This will remove the linked hotels permanently."
        confirmText="Delete" onCancel={() => setConfirm({ open: false, id: null })} onConfirm={remove}
      />
    </AdminShell>
  );
}
