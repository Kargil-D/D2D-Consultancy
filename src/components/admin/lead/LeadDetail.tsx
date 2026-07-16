"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Mail, MapPin, Phone, Users, CalendarDays, Edit, XCircle, Eye } from "lucide-react";
import { useToast } from "@/components/admin/ui/Toast";
import LeadStatusStepper from "@/components/admin/lead/LeadStatusStepper";
import { LeadStatusBadge } from "@/components/admin/lead/LeadStatusBadge";
import { leadsApi, quotationsApi } from "@/lib/adminApi";
import type { AdminLead, AdminQuotation, LeadStatus } from "@/types/admin";

interface LeadDetailProps {
  id: string;
}

const leadCode = (seq: number) => `LD-${seq.toString().padStart(4, "0")}`;
const quoteCode = (seq: number) => `QT-${seq.toString().padStart(4, "0")}`;
const formatINR = (v: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", currencyDisplay: "code", maximumFractionDigits: 0 }).format(v);

export default function LeadDetail({ id }: LeadDetailProps) {
  const { notify } = useToast();
  const [lead, setLead] = useState<AdminLead | null>(null);
  const [quotations, setQuotations] = useState<AdminQuotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const reload = useCallback(async () => {
    const [leadRes, quotesRes] = await Promise.all([leadsApi.get(id), quotationsApi.list({ leadId: id, pageSize: 50 })]);
    if (leadRes.success) {
      setLead(leadRes.data);
    } else {
      notify(leadRes.message || "Unable to load lead", "error");
    }
    if (quotesRes.success) setQuotations(quotesRes.data.items);
    setLoading(false);
  }, [id, notify]);

  useEffect(() => {
    reload();
  }, [reload]);

  const changeStatus = async (status: LeadStatus) => {
    if (!lead || status === lead.status) return;
    setUpdating(true);
    try {
      const res = await leadsApi.updateStatus(id, status);
      if (!res.success) return notify(res.message || "Unable to update status", "error");
      notify(`Status updated to ${status}`, "success");
      reload();
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center text-sm text-slate-500">
        Loading…
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center text-sm text-slate-500">
        Lead not found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white border border-slate-200 p-6">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-slate-500">{leadCode(lead.seq)}</span>
              <LeadStatusBadge status={lead.status} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">{lead.customerName}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/admin/leads/${id}/edit`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50"
            >
              <Edit className="w-4 h-4" /> Edit
            </Link>
            {lead.status !== "Lost" && lead.status !== "Won" && (
              <button
                type="button"
                disabled={updating}
                onClick={() => changeStatus("Lost")}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-rose-200 text-rose-700 text-sm font-semibold hover:bg-rose-50 disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" /> Mark Lost
              </button>
            )}
          </div>
        </div>
        <LeadStatusStepper status={lead.status} onChange={changeStatus} disabled={updating} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-white border border-slate-200 p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Contact Details</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-slate-700">
              <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" /> {lead.mobile}
            </div>
            {lead.email && (
              <div className="flex items-center gap-2 text-slate-700">
                <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" /> {lead.email}
              </div>
            )}
            <div className="flex items-center gap-2 text-slate-700">
              <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" /> {lead.destination?.name ?? "—"}
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <CalendarDays className="w-4 h-4 text-slate-400 flex-shrink-0" />
              {lead.travelDate ? new Date(lead.travelDate).toLocaleDateString("en-IN") : "Not set"}
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <Users className="w-4 h-4 text-slate-400 flex-shrink-0" />
              {lead.adults ?? 0} Adults{lead.children ? `, ${lead.children} Children` : ""}
            </div>
            {lead.remarks && (
              <div className="pt-2 border-t border-slate-100 text-slate-600">{lead.remarks}</div>
            )}
          </dl>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Activity Timeline</h3>
          {lead.activities && lead.activities.length > 0 ? (
            <ul className="space-y-3">
              {lead.activities.map((a) => (
                <li key={a.id} className="text-sm border-l-2 border-slate-200 pl-3">
                  <div className="text-slate-700">{a.message}</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {new Date(a.createdDate).toLocaleString("en-IN")}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">No activity yet.</p>
          )}
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-900">Quotations for this Lead</h3>
          <Link
            href={`/admin/quotations/new?leadId=${id}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
          >
            Create Quotation
          </Link>
        </div>
        {quotations.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">No quotations yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-slate-500 uppercase border-b border-slate-100">
                <th className="px-6 py-2">Quote ID</th>
                <th className="px-6 py-2">Destination</th>
                <th className="px-6 py-2">Selling Price</th>
                <th className="px-6 py-2">Status</th>
                <th className="px-6 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {quotations.map((q) => {
                const totalCost = q.items.reduce((sum, i) => sum + i.qty * i.cost, 0);
                const sellingPrice = totalCost + Math.round(totalCost * (q.marginPercent / 100));
                return (
                  <tr key={q.id} className="border-b border-slate-50">
                    <td className="px-6 py-3 font-mono text-xs font-semibold text-slate-700">{quoteCode(q.seq)}</td>
                    <td className="px-6 py-3">{q.destination?.name ?? "—"}</td>
                    <td className="px-6 py-3 font-semibold text-slate-900">{formatINR(sellingPrice)}</td>
                    <td className="px-6 py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {q.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <Link href={`/admin/quotations/${q.id}/edit`} className="inline-flex p-2 rounded-lg text-slate-600 hover:bg-slate-100" aria-label="Open">
                        <Eye className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
