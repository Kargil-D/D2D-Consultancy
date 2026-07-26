"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Plus, Edit, Trash2, UserRound } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import Breadcrumb from "@/components/admin/ui/Breadcrumb";
import DataTable, { type Column } from "@/components/admin/ui/DataTable";
import Pagination from "@/components/admin/ui/Pagination";
import ConfirmModal from "@/components/admin/ui/ConfirmModal";
import StatusToggle, { StatusBadge } from "@/components/admin/ui/StatusToggle";
import { useToast } from "@/components/admin/ui/Toast";
import { employeesApi } from "@/lib/adminApi";
import type { AdminEmployee } from "@/types/admin";

const PAGE_SIZE = 10;

export default function EmployeesAdminPage() {
  const { notify } = useToast();
  const [rows, setRows] = useState<AdminEmployee[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [confirm, setConfirm] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await employeesApi.list({ search, page, pageSize: PAGE_SIZE, filter: status ? { status } : {} });
      if (res.success) {
        setRows(res.data.items);
        setTotal(res.data.total);
      } else {
        notify(res.message || "Unable to load employees", "error");
      }
    } catch (error) {
      notify(error instanceof Error ? error.message : "Unable to load employees", "error");
    } finally {
      setLoading(false);
    }
  }, [search, page, status, notify]);

  useEffect(() => {
    reload();
  }, [reload]);

  const remove = async () => {
    if (!confirm.id) return;
    const res = await employeesApi.remove(confirm.id);
    if (!res.success) notify(res.message || "Unable to delete employee", "error");
    else notify("Employee deleted", "success");
    setConfirm({ open: false, id: null });
    reload();
  };

  const toggleStatus = async (id: string) => {
    await employeesApi.toggleStatus(id);
    reload();
  };

  const columns: Column<AdminEmployee>[] = [
    {
      key: "fullName",
      label: "Employee",
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-full overflow-hidden bg-slate-100 flex-shrink-0 flex items-center justify-center">
            {r.profilePhotoUrl ? (
              <Image src={r.profilePhotoUrl} alt={r.fullName} fill sizes="36px" className="object-cover" unoptimized />
            ) : (
              <UserRound className="w-4 h-4 text-slate-400" />
            )}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-900">{r.fullName}</div>
            <div className="text-xs text-slate-500">{r.employeeCode} · EMP-{String(r.seq).padStart(4, "0")}</div>
          </div>
        </div>
      ),
    },
    { key: "designation", label: "Designation", render: (r) => r.designation || "—" },
    { key: "department", label: "Department", render: (r) => r.department || "—" },
    { key: "employmentType", label: "Type", render: (r) => r.employmentType },
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
          <Link href={`/admin/employees/${r.id}/edit`} className="p-2 rounded-lg text-slate-600 hover:bg-slate-100" aria-label="Edit">
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
    <AdminShell title="Employees">
      <Breadcrumb items={[{ label: "PM", href: "/admin/pm" }, { label: "Employees" }]} />
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Employees</h1>
          <p className="text-sm text-slate-500 mt-0.5">Employee master — profile, employment, government IDs and bank details.</p>
        </div>
        <Link
          href="/admin/employees/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Employee
        </Link>
      </div>

      <DataTable<AdminEmployee>
        columns={columns}
        rows={rows}
        loading={loading}
        rowKey={(r) => r.id}
        search={search}
        onSearchChange={(v) => {
          setPage(1);
          setSearch(v);
        }}
        searchPlaceholder="Search by name, code, designation, department, email…"
        toolbar={
          <select
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
            className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white"
          >
            <option value="">All statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        }
      />
      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />

      <ConfirmModal
        open={confirm.open}
        title="Delete employee?"
        message="This will remove the employee from the directory. This action cannot be undone."
        confirmText="Delete"
        onCancel={() => setConfirm({ open: false, id: null })}
        onConfirm={remove}
      />
    </AdminShell>
  );
}
