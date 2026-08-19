"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Plus, Edit, Trash2 } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import Breadcrumb from "@/components/admin/ui/Breadcrumb";
import DataTable, { type Column } from "@/components/admin/ui/DataTable";
import Pagination from "@/components/admin/ui/Pagination";
import Drawer from "@/components/admin/ui/Drawer";
import ConfirmModal from "@/components/admin/ui/ConfirmModal";
import { StatusBadge } from "@/components/admin/ui/StatusToggle";
import { Field, inputCls } from "@/components/admin/ui/Field";
import ImageUpload from "@/components/admin/ui/ImageUpload";
import { useToast } from "@/components/admin/ui/Toast";
import LoadingOverlay from "@/components/admin/ui/LoadingOverlay";
import { transferTypesApi } from "@/lib/adminApi";
import type { AdminTransferType } from "@/types/admin";

const PAGE_SIZE = 10;

const emptyForm = (): Partial<AdminTransferType> => ({
  name: "",
  imageUrl: "",
  status: "Active",
});

export default function TransfersAdminPage() {
  const { notify } = useToast();
  const [rows, setRows] = useState<AdminTransferType[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [drawer, setDrawer] = useState<{ open: boolean; form: Partial<AdminTransferType> }>({
    open: false,
    form: emptyForm(),
  });
  const [confirm, setConfirm] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    const list = await transferTypesApi.list({ search, page, pageSize: PAGE_SIZE });
    setLoading(false);
    if (list.success) {
      setRows(list.data.items);
      setTotal(list.data.total);
    }
  }, [search, page]);

  useEffect(() => { reload(); }, [reload]);

  const openCreate = () => setDrawer({ open: true, form: emptyForm() });
  const openEdit = (row: AdminTransferType) => setDrawer({ open: true, form: { ...row } });

  const closeDrawer = () => {
    if (saving) return;
    setDrawer({ open: false, form: emptyForm() });
  };

  const setForm = (patch: Partial<AdminTransferType>) =>
    setDrawer((d) => ({ ...d, form: { ...d.form, ...patch } }));

  const save = async () => {
    if (saving) return;
    const f = drawer.form;
    if (!f.name?.trim()) return notify("Transfer type name is required", "error");

    setSaving(true);
    try {
      if (f.id) {
        const res = await transferTypesApi.update(f.id, f);
        if (!res.success) return notify(res.message || "Unable to update transfer type", "error");
        notify("Transfer type updated", "success");
      } else {
        const res = await transferTypesApi.create(f as Omit<AdminTransferType, "id">);
        if (!res.success) return notify(res.message || "Unable to create transfer type", "error");
        notify("Transfer type created", "success");
      }
      setDrawer({ open: false, form: emptyForm() });
      await reload();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Unexpected error", "error");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirm.id || deleting) return;
    setDeleting(true);
    try {
      const res = await transferTypesApi.remove(confirm.id);
      if (!res.success) {
        notify(res.message || "Unable to delete transfer type", "error");
        return;
      }
      notify("Transfer type deleted", "success");
      setConfirm({ open: false, id: null });
      await reload();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Unable to delete transfer type", "error");
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<AdminTransferType>[] = [
    {
      key: "name",
      label: "Transfer Type",
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
            {r.imageUrl && <Image src={r.imageUrl} alt={r.name} fill sizes="40px" className="object-cover" unoptimized />}
          </div>
          <div className="font-semibold text-slate-900 text-sm">{r.name}</div>
        </div>
      ),
    },
    { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
    {
      key: "actions", label: "Actions", className: "text-right",
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <button onClick={() => openEdit(r)} className="p-2 rounded-lg text-slate-600 hover:bg-slate-100" aria-label="Edit"><Edit className="w-4 h-4" /></button>
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
    <AdminShell title="Transfer Types">
      <Breadcrumb items={[{ label: "PM", href: "/admin/pm" }, { label: "Transfer Types" }]} />
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transfer Types</h1>
          <p className="text-sm text-slate-500 mt-0.5">Standalone transfer type list, independent of campaigns.</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 shadow-sm">
          <Plus className="w-4 h-4" /> Add Transfer Type
        </button>
      </div>

      <DataTable<AdminTransferType>
        columns={columns} rows={rows} loading={loading} rowKey={(r) => r.id}
        search={search} onSearchChange={(v) => { setPage(1); setSearch(v); }}
        searchPlaceholder="Search transfer types…"
      />
      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />

      <Drawer
        open={drawer.open}
        title={drawer.form.id ? "Edit Transfer Type" : "New Transfer Type"}
        onClose={closeDrawer}
        footer={
          <>
            <button onClick={closeDrawer} disabled={saving} className="px-4 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed">Cancel</button>
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving && <span className="inline-block w-3.5 h-3.5 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />}
              {drawer.form.id ? (saving ? "Updating…" : "Update") : saving ? "Creating…" : "Create"}
            </button>
          </>
        }
      >
        <LoadingOverlay show={saving} label={drawer.form.id ? "Updating transfer type…" : "Creating transfer type…"} />
        <div className="space-y-5">
          <Field label="Transfer Type" required>
            <input className={inputCls} value={drawer.form.name ?? ""} onChange={(e) => setForm({ name: e.target.value })} placeholder="Speedboat" />
          </Field>
          <Field label="Transfer Image">
            <ImageUpload value={drawer.form.imageUrl ?? ""} onChange={(url) => setForm({ imageUrl: url })} aspect="4/3" />
          </Field>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={drawer.form.status === "Active"}
              onChange={(e) => setForm({ status: e.target.checked ? "Active" : "Inactive" })}
              className="w-4 h-4 rounded"
            />
            Active
          </label>
        </div>
      </Drawer>

      <ConfirmModal
        open={confirm.open} title="Delete transfer type?" message="This will remove the transfer type permanently."
        confirmText="Delete" loading={deleting} onCancel={() => setConfirm({ open: false, id: null })} onConfirm={remove}
      />
    </AdminShell>
  );
}
