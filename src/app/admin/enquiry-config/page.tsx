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
import TagInput from "@/components/admin/ui/TagInput";
import { Field, inputCls, selectCls } from "@/components/admin/ui/Field";
import { useToast } from "@/components/admin/ui/Toast";
import { destinationsApi, enquiryConfigApi, packagesApi } from "@/lib/adminApi";
import type { AdminDestination, AdminEnquiryConfig, AdminPackage, Status, TravelType } from "@/types/admin";

const PAGE_SIZE = 10;
const TRAVEL_TYPES: TravelType[] = ["Family", "Honeymoon", "Adventure", "Group", "Solo"];

const emptyForm = (): Partial<AdminEnquiryConfig> => ({
  destinationId: "",
  packageId: "",
  preferredMonths: [],
  budgetRanges: ["Under 50K", "50K – 1L", "1L – 2L", "2L+"],
  travelTypes: [],
  maxTravelers: 10,
  autoTagPackage: false,
  status: "Active",
});

export default function EnquiryConfigAdminPage() {
  const { notify } = useToast();
  const [rows, setRows] = useState<AdminEnquiryConfig[]>([]);
  const [destinations, setDestinations] = useState<AdminDestination[]>([]);
  const [packages, setPackages] = useState<AdminPackage[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [drawer, setDrawer] = useState<{ open: boolean; form: Partial<AdminEnquiryConfig> }>({ open: false, form: emptyForm() });
  const [confirm, setConfirm] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    const [list, d, p] = await Promise.all([
      enquiryConfigApi.list({ search, page, pageSize: PAGE_SIZE }),
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

  const destName = (id: string) => destinations.find((d) => d.id === id)?.name ?? "—";
  const pkgName = (id?: string) => packages.find((p) => p.id === id)?.name ?? "—";

  const openCreate = () => setDrawer({ open: true, form: emptyForm() });
  const openEdit = (row: AdminEnquiryConfig) => setDrawer({ open: true, form: { ...row } });

  const save = async () => {
    const f = drawer.form;
    if (!f.destinationId) return notify("Destination is required", "error");
    if (f.id) await enquiryConfigApi.update(f.id, f);
    else await enquiryConfigApi.create(f as Omit<AdminEnquiryConfig, "id">);
    notify(f.id ? "Config updated" : "Config created");
    setDrawer({ open: false, form: emptyForm() });
    reload();
  };

  const remove = async () => {
    if (!confirm.id) return;
    await enquiryConfigApi.remove(confirm.id);
    notify("Config deleted");
    setConfirm({ open: false, id: null });
    reload();
  };

  const toggleStatus = async (id: string) => { await enquiryConfigApi.toggleStatus(id); reload(); };

  const toggleTravelType = (t: TravelType) => {
    const cur = drawer.form.travelTypes ?? [];
    setDrawer((d) => ({
      ...d,
      form: { ...d.form, travelTypes: cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t] },
    }));
  };

  const columns: Column<AdminEnquiryConfig>[] = [
    { key: "destination", label: "Destination", render: (r) => destName(r.destinationId) },
    { key: "package", label: "Package", render: (r) => pkgName(r.packageId) },
    {
      key: "months", label: "Months",
      render: (r) => <span className="text-xs text-slate-500">{r.preferredMonths.join(", ") || "—"}</span>,
    },
    { key: "max", label: "Max Travelers", render: (r) => r.maxTravelers },
    { key: "autoTag", label: "Auto-Tag", render: (r) => r.autoTagPackage ? "Yes" : "No" },
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
    <AdminShell title="Enquiry Configuration">
      <Breadcrumb items={[{ label: "Enquiry Configuration" }]} />
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Enquiry Configuration</h1>
          <p className="text-sm text-slate-500 mt-0.5">Map destinations & packages to enquiry tabs with custom budget, months and travel-type options.</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 shadow-sm">
          <Plus className="w-4 h-4" /> Add Mapping
        </button>
      </div>

      <DataTable<AdminEnquiryConfig>
        columns={columns} rows={rows} loading={loading} rowKey={(r) => r.id}
        search={search} onSearchChange={(v) => { setPage(1); setSearch(v); }}
        searchPlaceholder="Search by destination…"
      />
      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />

      <Drawer
        open={drawer.open}
        title={drawer.form.id ? "Edit Enquiry Config" : "New Enquiry Config"}
        onClose={() => setDrawer({ open: false, form: emptyForm() })}
        width="lg"
        footer={
          <>
            <button onClick={() => setDrawer({ open: false, form: emptyForm() })} className="px-4 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100">Cancel</button>
            <button onClick={save} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700">{drawer.form.id ? "Update" : "Create"}</button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Destination" required>
              <select className={selectCls} value={drawer.form.destinationId ?? ""} onChange={(e) => setDrawer((d) => ({ ...d, form: { ...d.form, destinationId: e.target.value } }))}>
                <option value="">Select destination</option>
                {destinations.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </Field>
            <Field label="Linked Package (optional)">
              <select className={selectCls} value={drawer.form.packageId ?? ""} onChange={(e) => setDrawer((d) => ({ ...d, form: { ...d.form, packageId: e.target.value } }))}>
                <option value="">— Any package —</option>
                {packages.filter((p) => !drawer.form.destinationId || p.destinationId === drawer.form.destinationId).map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Max Travelers">
              <input type="number" className={inputCls} value={drawer.form.maxTravelers ?? 10}
                onChange={(e) => setDrawer((d) => ({ ...d, form: { ...d.form, maxTravelers: Number(e.target.value) } }))} />
            </Field>
            <Field label="Status">
              <select className={selectCls} value={drawer.form.status ?? "Active"} onChange={(e) => setDrawer((d) => ({ ...d, form: { ...d.form, status: e.target.value as Status } }))}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </Field>
          </div>

          <Field label="Preferred Travel Months" hint="E.g. January, February">
            <TagInput value={drawer.form.preferredMonths ?? []} onChange={(v) => setDrawer((d) => ({ ...d, form: { ...d.form, preferredMonths: v } }))} placeholder="January" />
          </Field>

          <Field label="Budget Ranges">
            <TagInput value={drawer.form.budgetRanges ?? []} onChange={(v) => setDrawer((d) => ({ ...d, form: { ...d.form, budgetRanges: v } }))} placeholder="Under 50K" />
          </Field>

          <Field label="Travel Types">
            <div className="flex flex-wrap gap-2">
              {TRAVEL_TYPES.map((t) => {
                const active = drawer.form.travelTypes?.includes(t);
                return (
                  <button key={t} type="button" onClick={() => toggleTravelType(t)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                      active ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:border-blue-400"
                    }`}>{t}</button>
                );
              })}
            </div>
          </Field>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={!!drawer.form.autoTagPackage}
              onChange={(e) => setDrawer((d) => ({ ...d, form: { ...d.form, autoTagPackage: e.target.checked } }))}
              className="w-4 h-4 rounded" />
            Auto-tag enquiries to this package
          </label>
        </div>
      </Drawer>

      <ConfirmModal open={confirm.open} title="Delete config?" message="This mapping will be removed."
        confirmText="Delete" onCancel={() => setConfirm({ open: false, id: null })} onConfirm={remove} />
    </AdminShell>
  );
}
