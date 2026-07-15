"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Field, inputCls, textareaCls, selectCls } from "@/components/admin/ui/Field";
import { useToast } from "@/components/admin/ui/Toast";
import { destinationsApi, leadsApi, salesUsersApi } from "@/lib/adminApi";
import type { AdminDestination, AdminLead, AdminSalesUser, LeadSource } from "@/types/admin";

interface LeadFormProps {
  id?: string;
}

const SOURCES: LeadSource[] = ["Website", "MetaAds", "GoogleAds", "SEO", "WhatsApp", "Referral", "Manual"];

const emptyForm = (): Partial<AdminLead> => ({
  customerName: "",
  mobile: "",
  email: "",
  destinationId: "",
  travelDate: "",
  source: "Manual",
  adults: undefined,
  children: undefined,
  assignedToId: "",
  remarks: "",
});

export default function LeadForm({ id }: LeadFormProps) {
  const router = useRouter();
  const { notify } = useToast();
  const [form, setForm] = useState<Partial<AdminLead>>(emptyForm());
  const [destinations, setDestinations] = useState<AdminDestination[]>([]);
  const [salesUsers, setSalesUsers] = useState<AdminSalesUser[]>([]);
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const [destRes, salesRes] = await Promise.all([destinationsApi.all(), salesUsersApi.list()]);
      if (destRes.success) setDestinations(destRes.data);
      if (salesRes.success) setSalesUsers(salesRes.data);
    })();
  }, []);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const res = await leadsApi.get(id);
      if (res.success && res.data) {
        setForm({
          ...res.data,
          travelDate: res.data.travelDate ? res.data.travelDate.slice(0, 10) : "",
        });
      } else {
        notify(res.message || "Unable to load lead", "error");
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onChange = (next: Partial<AdminLead>) => setForm((f) => ({ ...f, ...next }));

  const canSave = !!form.customerName && !!form.mobile && !!form.destinationId && !!form.source;

  const save = async () => {
    if (!canSave) return notify("Customer name, mobile, destination and source are required", "error");
    const payload: Partial<AdminLead> = { ...form };

    setSaving(true);
    try {
      if (id) {
        const res = await leadsApi.update(id, payload);
        if (!res.success) return notify(res.message || "Unable to update lead", "error");
        notify("Lead updated", "success");
      } else {
        const res = await leadsApi.create(payload);
        if (!res.success) return notify(res.message || "Unable to create lead", "error");
        notify("Lead created", "success");
      }
      router.push("/admin/leads");
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
        <h2 className="text-xl font-bold text-slate-900">{id ? "Edit Lead" : "New Lead"}</h2>
        <div className="flex items-center gap-2">
          <Link href="/admin/leads" className="px-4 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100">
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
            {id ? "Update" : "Save Lead"}
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Customer Name" required>
            <input className={inputCls} value={form.customerName ?? ""} onChange={(e) => onChange({ customerName: e.target.value })} placeholder="Jane Doe" />
          </Field>
          <Field label="Mobile Number" required>
            <input className={inputCls} value={form.mobile ?? ""} onChange={(e) => onChange({ mobile: e.target.value })} placeholder="+91 98765 43210" />
          </Field>
          <Field label="Email">
            <input type="email" className={inputCls} value={form.email ?? ""} onChange={(e) => onChange({ email: e.target.value })} placeholder="jane@example.com" />
          </Field>
          <Field label="Destination" required>
            <select className={selectCls} value={form.destinationId ?? ""} onChange={(e) => onChange({ destinationId: e.target.value })}>
              <option value="">Select destination</option>
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Travel Date">
            <input type="date" className={inputCls} value={form.travelDate ?? ""} onChange={(e) => onChange({ travelDate: e.target.value })} />
          </Field>
          <Field label="Source" required>
            <select className={selectCls} value={form.source ?? "Manual"} onChange={(e) => onChange({ source: e.target.value as LeadSource })}>
              {SOURCES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="No. of Adults">
            <input
              type="number"
              min={0}
              className={inputCls}
              value={form.adults ?? ""}
              onChange={(e) => onChange({ adults: e.target.value ? Number(e.target.value) : undefined })}
            />
          </Field>
          <Field label="No. of Children">
            <input
              type="number"
              min={0}
              className={inputCls}
              value={form.children ?? ""}
              onChange={(e) => onChange({ children: e.target.value ? Number(e.target.value) : undefined })}
            />
          </Field>
          <Field label="Assigned Sales Person">
            <select className={selectCls} value={form.assignedToId ?? ""} onChange={(e) => onChange({ assignedToId: e.target.value || undefined })}>
              <option value="">Unassigned</option>
              {salesUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Remarks">
          <textarea className={textareaCls} value={form.remarks ?? ""} onChange={(e) => onChange({ remarks: e.target.value })} rows={4} />
        </Field>
      </div>
    </div>
  );
}
