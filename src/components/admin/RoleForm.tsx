"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check } from "lucide-react";
import { Field, inputCls, textareaCls, selectCls } from "@/components/admin/ui/Field";
import { useToast } from "@/components/admin/ui/Toast";
import { rolesApi } from "@/lib/adminApi";
import { DEPARTMENTS, type DepartmentModule, type PermissionAction } from "@/lib/adminModules";
import type { AdminModule, AdminRolePermission, Status } from "@/types/admin";

interface Props {
  id?: string;
}

type Action = PermissionAction;

const DEPARTMENT_CONFIG = DEPARTMENTS;

const MODULE_CONFIG = DEPARTMENT_CONFIG.flatMap((d) => d.modules);

const ACTION_LABELS: Record<Action, string> = { canView: "View", canAdd: "Add", canEdit: "Edit", canDelete: "Delete" };

const emptyPermissions = (): Record<AdminModule, AdminRolePermission> =>
  Object.fromEntries(
    MODULE_CONFIG.map((m) => [m.module, { module: m.module, canView: false, canAdd: false, canEdit: false, canDelete: false }]),
  ) as Record<AdminModule, AdminRolePermission>;

export default function RoleForm({ id }: Props) {
  const router = useRouter();
  const { notify } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Status>("Active");
  const [permissions, setPermissions] = useState<Record<AdminModule, AdminRolePermission>>(emptyPermissions());
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const res = await rolesApi.get(id);
      if (res.success && res.data) {
        setName(res.data.name);
        setDescription(res.data.description);
        setStatus(res.data.status);
        setPermissions((prev) => {
          const next = { ...prev };
          for (const p of res.data!.permissions) next[p.module] = p;
          return next;
        });
      } else {
        notify(res.message || "Unable to load role", "error");
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const toggleGroup = (dept: { modules: DepartmentModule[] }, action: Action) => {
    const applicable = dept.modules.filter((m) => m.actions.includes(action));
    if (applicable.length === 0) return;
    setPermissions((prev) => {
      const allGranted = applicable.every((m) => prev[m.module][action]);
      const next = { ...prev };
      for (const m of applicable) next[m.module] = { ...next[m.module], [action]: !allGranted };
      return next;
    });
  };

  const toggleGroupAll = (dept: { modules: DepartmentModule[] }) => {
    setPermissions((prev) => {
      const allGranted = dept.modules.every((m) => m.actions.every((a) => prev[m.module][a]));
      const next = { ...prev };
      for (const m of dept.modules) {
        const updated = { ...next[m.module] };
        for (const a of m.actions) updated[a] = !allGranted;
        next[m.module] = updated;
      }
      return next;
    });
  };

  const canSave = !!name.trim();

  const save = async () => {
    if (!canSave) return notify("Role Name is required", "error");
    const payload = { name: name.trim(), description, status, permissions: Object.values(permissions) };

    setSaving(true);
    try {
      if (id) {
        const res = await rolesApi.update(id, payload);
        if (!res.success) return notify(res.message || "Unable to update role", "error");
        notify("Role updated", "success");
      } else {
        const res = await rolesApi.create(payload);
        if (!res.success) return notify(res.message || "Unable to create role", "error");
        notify("Role created", "success");
      }
      router.push("/admin/roles");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Unexpected error", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center text-sm text-slate-500">
        Loading…
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
        <h2 className="text-xl font-bold text-slate-900">{id ? "Edit Role" : "New Role"}</h2>
        <div className="flex items-center gap-2">
          <Link href="/admin/roles" className="px-4 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100">
            Cancel
          </Link>
          <button
            type="button"
            onClick={save}
            disabled={!canSave || saving}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm ${
              !canSave || saving ? "opacity-50 cursor-not-allowed hover:bg-blue-600" : ""
            }`}
          >
            {id ? "Save Changes" : "Create Role"}
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Role Name" required className="md:col-span-1">
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Sales" />
          </Field>
          <Field label="Description" className="md:col-span-1">
            <textarea className={`${textareaCls} min-h-[42px]`} value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          <Field label="Status" hint={status === "Inactive" ? "Users with this role will be unable to log in" : undefined}>
            <select className={selectCls} value={status} onChange={(e) => setStatus(e.target.value as Status)}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </Field>
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-800 mb-1">Module Permissions</h3>
          <p className="text-xs text-slate-500 mb-3">Select the permissions for each module.</p>
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-slate-500 uppercase border-b border-slate-100 bg-slate-50">
                  <th className="px-4 py-2.5">Module</th>
                  {(["canView", "canAdd", "canEdit", "canDelete"] as Action[]).map((a) => (
                    <th key={a} className="px-4 py-2.5 text-center">{ACTION_LABELS[a]}</th>
                  ))}
                  <th className="px-4 py-2.5 text-center">Full Access</th>
                </tr>
              </thead>
              <tbody>
                {DEPARTMENT_CONFIG.map((dept) => {
                  const fullAccessChecked = dept.modules.every((m) => m.actions.every((a) => permissions[m.module][a]));
                  return (
                    <tr key={dept.label} className="border-b border-slate-50">
                      <td className="px-4 py-2.5 font-medium text-slate-800">{dept.label}</td>
                      {(["canView", "canAdd", "canEdit", "canDelete"] as Action[]).map((a) => {
                        const applicable = dept.modules.filter((m) => m.actions.includes(a));
                        const checked = applicable.length > 0 && applicable.every((m) => permissions[m.module][a]);
                        return (
                          <td key={a} className="px-4 py-2.5 text-center">
                            {applicable.length > 0 ? (
                              <button
                                type="button"
                                onClick={() => toggleGroup(dept, a)}
                                className={`inline-flex items-center justify-center w-6 h-6 rounded-md border transition-colors ${
                                  checked
                                    ? "bg-blue-600 border-blue-600 text-white"
                                    : "bg-white border-slate-300 text-transparent hover:border-blue-400"
                                }`}
                                aria-label={`${ACTION_LABELS[a]} ${dept.label}`}
                                aria-pressed={checked}
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-4 py-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => toggleGroupAll(dept)}
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-md border transition-colors ${
                            fullAccessChecked
                              ? "bg-emerald-600 border-emerald-600 text-white"
                              : "bg-white border-slate-300 text-transparent hover:border-emerald-400"
                          }`}
                          aria-label={`Full access to ${dept.label}`}
                          aria-pressed={fullAccessChecked}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
