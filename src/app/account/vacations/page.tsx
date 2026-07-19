"use client";

import { useEffect, useState } from "react";
import { Compass } from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { LeadStatusBadge } from "@/components/admin/lead/LeadStatusBadge";
import type { AdminLead } from "@/types/admin";

export default function YourVacationsPage() {
  const [leads, setLeads] = useState<AdminLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<{ leads: AdminLead[] }>("/api/customer/vacations")
      .then((data) => setLeads(data.leads))
      .catch((e) => setError(e instanceof Error ? e.message : "Unable to load your vacations"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Your Vacations</h1>
      <p className="text-sm text-slate-500 mb-6">Every trip enquiry you&apos;ve made with us.</p>

      {loading ? (
        <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center text-sm text-slate-500">Loading…</div>
      ) : error ? (
        <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center text-sm text-rose-600">{error}</div>
      ) : leads.length === 0 ? (
        <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center">
          <Compass className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No vacations yet — start planning your next trip!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {leads.map((lead) => (
            <div key={lead.id} className="rounded-2xl bg-white border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-slate-900">{lead.destination?.name ?? "Destination"}</h3>
                <LeadStatusBadge status={lead.status} />
              </div>
              <p className="text-sm text-slate-500">
                {lead.travelDate ? new Date(lead.travelDate).toLocaleDateString("en-IN") : "Travel date not set"}
              </p>
              {lead.remarks && <p className="text-xs text-slate-400 mt-2">{lead.remarks}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
