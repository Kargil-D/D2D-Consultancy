"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2, ShieldCheck } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import Breadcrumb from "@/components/admin/ui/Breadcrumb";
import DataTable, { type Column } from "@/components/admin/ui/DataTable";
import Pagination from "@/components/admin/ui/Pagination";
import ConfirmModal from "@/components/admin/ui/ConfirmModal";
import StatusToggle, { StatusBadge } from "@/components/admin/ui/StatusToggle";
import { useToast } from "@/components/admin/ui/Toast";
import { rolesApi } from "@/lib/adminApi";
import type { AdminRole } from "@/types/admin";

const PAGE_SIZE = 10;

export default function RolesAdminPage() {
  const { notify } = useToast();
  const [rows, setRows] = useState<AdminRole[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [confirm, setConfirm] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await rolesApi.list({ search, page, pageSize: PAGE_SIZE });
      if (res.success) {
        setRows(res.data.items);
        setTotal(res.data.total);
      } else {
        notify(res.message || "Unable to load roles", "error");
      }
    } catch (error) {
      notify(error instanceof Error ? error.message : "Unable to load roles", "error");
    } finally {
      setLoading(false);
    }
  }, [search, page, notify]);

  useEffect(() => {
    reload();
  }, [reload]);

  const remove = async () => {
    if (!confirm.id) return;
    const res = await rolesApi.remove(confirm.id);
    if (!res.success) notify(res.message || "Unable to delete role", "error");
    else notify("Role deleted", "success");
    setConfirm({ open: false, id: null });
    reload();
  };

  const toggleStatus = async (id: string) => {
    const res = await rolesApi.toggleStatus(id);
    if (!res.success) notify(res.message || "Unable to update status", "error");
    reload();
  };

  const columns: Column<AdminRole>[] = [
    {
      key: "name",
      label: "Role",
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="text-sm font-semibold text-slate-900">{r.name}</div>
        </div>
      ),
    },
    { key: "description", label: "Description", render: (r) => <span className="text-slate-600">{r.description || "—"}</span> },
    {
      key: "permissions",
      label: "Modules Granted",
      render: (r) => {
        const granted = r.permissions.filter((p) => p.canView || p.canAdd || p.canEdit || p.canDelete).length;
        return <span className="text-slate-600">{granted} / 10</span>;
      },
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
          <Link href={`/admin/roles/${r.id}/edit`} className="p-2 rounded-lg text-slate-600 hover:bg-slate-100" aria-label="Edit">
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
    <AdminShell title="Roles">
      <Breadcrumb items={[{ label: "PM", href: "/admin/pm" }, { label: "Roles" }]} />
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Roles</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Define roles and their module permissions, then assign them to employees from the Employee screen. Setting a role Inactive blocks login for everyone who has it.
          </p>
        </div>
        <Link
          href="/admin/roles/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Role
        </Link>
      </div>

      <DataTable<AdminRole>
        columns={columns}
        rows={rows}
        loading={loading}
        rowKey={(r) => r.id}
        search={search}
        onSearchChange={(v) => {
          setPage(1);
          setSearch(v);
        }}
        searchPlaceholder="Search by role name or description…"
      />
      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />

      <ConfirmModal
        open={confirm.open}
        title="Delete role?"
        message="Roles still assigned to a user can't be deleted — reassign those users first. This action cannot be undone."
        confirmText="Delete"
        onCancel={() => setConfirm({ open: false, id: null })}
        onConfirm={remove}
      />
    </AdminShell>
  );
}
