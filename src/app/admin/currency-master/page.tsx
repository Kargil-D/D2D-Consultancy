"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit, History, Power } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import Breadcrumb from "@/components/admin/ui/Breadcrumb";
import DataTable, { type Column } from "@/components/admin/ui/DataTable";
import Pagination from "@/components/admin/ui/Pagination";
import Drawer from "@/components/admin/ui/Drawer";
import StatusToggle, { StatusBadge } from "@/components/admin/ui/StatusToggle";
import { Field, inputCls } from "@/components/admin/ui/Field";
import { useToast } from "@/components/admin/ui/Toast";
import RateHistoryModal from "@/components/admin/currency/RateHistoryModal";
import { currenciesApi } from "@/lib/adminApi";
import { useAuth } from "@/contexts/AuthContext";
import type { AdminCurrency } from "@/types/admin";

const PAGE_SIZE = 10;

const emptyForm = (): Partial<AdminCurrency> => ({
  code: "",
  name: "",
  exchangeRate: undefined,
  effectiveFrom: new Date().toISOString().slice(0, 10),
  status: "Active",
});

export default function CurrencyMasterPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const { notify } = useToast();

  const isAdmin = !!user?.roles.includes("admin");

  const [rows, setRows] = useState<AdminCurrency[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [drawer, setDrawer] = useState<{ open: boolean; form: Partial<AdminCurrency> }>({
    open: false,
    form: emptyForm(),
  });
  const [historyFor, setHistoryFor] = useState<AdminCurrency | null>(null);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isAdmin)) {
      router.replace(`/login?redirect=${encodeURIComponent("/admin/currency-master")}`);
    }
  }, [authLoading, isAuthenticated, isAdmin, router]);

  const reload = useCallback(async () => {
    setLoading(true);
    const res = await currenciesApi.list({ search, page, pageSize: PAGE_SIZE });
    setLoading(false);
    if (res.success) {
      setRows(res.data.items);
      setTotal(res.data.total);
    }
  }, [search, page]);

  useEffect(() => {
    if (isAuthenticated && isAdmin) reload();
  }, [reload, isAuthenticated, isAdmin]);

  const openCreate = () => setDrawer({ open: true, form: emptyForm() });
  const openEdit = (row: AdminCurrency) =>
    setDrawer({ open: true, form: { ...row, effectiveFrom: row.effectiveFrom.slice(0, 10) } });

  const setForm = (patch: Partial<AdminCurrency>) =>
    setDrawer((d) => ({ ...d, form: { ...d.form, ...patch } }));

  const save = async () => {
    const f = drawer.form;
    if (!f.code?.trim()) return notify("Currency code is required", "error");
    if (!f.name?.trim()) return notify("Currency name is required", "error");
    if (!f.exchangeRate || f.exchangeRate <= 0) return notify("Enter a valid exchange rate", "error");
    if (!f.effectiveFrom) return notify("Effective from date is required", "error");

    const res = f.id ? await currenciesApi.update(f.id, f) : await currenciesApi.create(f as Omit<AdminCurrency, "id" | "createdDate" | "updatedDate">);
    if (!res.success) return notify(res.message || "Unable to save currency", "error");
    notify(f.id ? "Currency updated" : "Currency added", "success");
    setDrawer({ open: false, form: emptyForm() });
    reload();
  };

  const toggleStatus = async (row: AdminCurrency) => {
    const res = await currenciesApi.toggleStatus(row.id);
    if (!res.success) return notify(res.message || "Unable to update status", "error");
    notify(`${row.code} is now ${res.data?.status}`, "success");
    reload();
  };

  const columns: Column<AdminCurrency>[] = [
    { key: "code", label: "Code", render: (r) => <span className="font-mono text-xs font-bold text-slate-900">{r.code}</span> },
    { key: "name", label: "Currency Name" },
    { key: "exchangeRate", label: "Exchange Rate (To INR)", render: (r) => r.exchangeRate },
    { key: "effectiveFrom", label: "Effective From", render: (r) => new Date(r.effectiveFrom).toLocaleDateString("en-IN") },
    { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "updatedDate", label: "Last Updated", render: (r) => (r.updatedDate ? new Date(r.updatedDate).toLocaleString("en-IN") : "—") },
    { key: "updatedBy", label: "Updated By", render: (r) => r.updatedBy ?? "—" },
    {
      key: "actions",
      label: "Actions",
      className: "text-right",
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <button onClick={() => setHistoryFor(r)} className="p-2 rounded-lg text-slate-600 hover:bg-slate-100" aria-label="View rate history" title="View Rate History">
            <History className="w-4 h-4" />
          </button>
          <button
            onClick={() => toggleStatus(r)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            aria-label={r.status === "Active" ? "Deactivate currency" : "Activate currency"}
            title={r.status === "Active" ? "Deactivate" : "Activate"}
          >
            <Power className="w-4 h-4" />
          </button>
          <button onClick={() => openEdit(r)} className="p-2 rounded-lg text-slate-600 hover:bg-slate-100" aria-label="Edit currency" title="Edit">
            <Edit className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  if (authLoading || !isAuthenticated || !isAdmin) {
    return (
      <AdminShell title="Currency Master">
        <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center text-sm text-slate-500">Loading…</div>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Currency Master">
      <Breadcrumb items={[{ label: "Finance", href: "/admin/finance" }, { label: "Currency Master" }]} />
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Currency Master</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Exchange rates used to convert foreign supplier costs into INR across quotations.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Currency
        </button>
      </div>

      <DataTable<AdminCurrency>
        columns={columns}
        rows={rows}
        loading={loading}
        rowKey={(r) => r.id}
        search={search}
        onSearchChange={(v) => {
          setPage(1);
          setSearch(v);
        }}
        searchPlaceholder="Search by code or name…"
      />
      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />

      <Drawer
        open={drawer.open}
        title={drawer.form.id ? "Edit Currency" : "Add Currency"}
        onClose={() => setDrawer({ open: false, form: emptyForm() })}
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
        <div className="space-y-5">
          <Field label="Currency Code" required hint="e.g. USD, THB, AED">
            <input
              className={inputCls}
              value={drawer.form.code ?? ""}
              onChange={(e) => setForm({ code: e.target.value.toUpperCase() })}
              disabled={!!drawer.form.id}
              placeholder="USD"
              maxLength={6}
            />
          </Field>
          <Field label="Currency Name" required>
            <input className={inputCls} value={drawer.form.name ?? ""} onChange={(e) => setForm({ name: e.target.value })} placeholder="US Dollar" />
          </Field>
          <Field label="Exchange Rate (To INR)" required>
            <input
              type="number"
              min={0}
              step="0.0001"
              className={inputCls}
              value={drawer.form.exchangeRate ?? ""}
              onChange={(e) => setForm({ exchangeRate: Number(e.target.value) })}
              placeholder="83.25"
            />
          </Field>
          <Field label="Effective From" required>
            <input
              type="date"
              className={inputCls}
              value={drawer.form.effectiveFrom ?? ""}
              onChange={(e) => setForm({ effectiveFrom: e.target.value })}
            />
          </Field>
          <Field label="Status">
            <StatusToggle value={drawer.form.status ?? "Active"} onChange={(status) => setForm({ status })} />
          </Field>
        </div>
      </Drawer>

      <RateHistoryModal currencyId={historyFor?.id ?? null} currencyCode={historyFor?.code} onClose={() => setHistoryFor(null)} />
    </AdminShell>
  );
}
