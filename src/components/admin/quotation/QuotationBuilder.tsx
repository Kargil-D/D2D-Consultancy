"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Plus, Trash2, FileDown, Mail, Share2, Copy, Save } from "lucide-react";
import { Field, inputCls, selectCls } from "@/components/admin/ui/Field";
import { useToast } from "@/components/admin/ui/Toast";
import { destinationsApi, leadsApi, packagesApi, quotationsApi } from "@/lib/adminApi";
import type { AdminLead, AdminDestination, AdminPackage, AdminQuotationItem, QuotationComponentType } from "@/types/admin";

interface QuotationBuilderProps {
  id?: string;
}

const COMPONENTS: QuotationComponentType[] = ["Hotel", "Transfer", "Activity", "Visa", "Insurance", "Flight"];

const emptyRow = (sortOrder: number): AdminQuotationItem => ({
  component: "Hotel",
  detail: "",
  qty: 1,
  cost: 0,
  sortOrder,
});

const formatINR = (v: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", currencyDisplay: "code", maximumFractionDigits: 0 }).format(v);

export default function QuotationBuilder({ id }: QuotationBuilderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { notify } = useToast();

  const [leads, setLeads] = useState<AdminLead[]>([]);
  const [destinations, setDestinations] = useState<AdminDestination[]>([]);
  const [campaigns, setCampaigns] = useState<AdminPackage[]>([]);

  const [leadId, setLeadId] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [marginPercent, setMarginPercent] = useState(0);
  const [items, setItems] = useState<AdminQuotationItem[]>([emptyRow(0)]);
  const [status, setStatus] = useState<string>("Draft");
  const [shareToken, setShareToken] = useState<string | null>(null);

  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  // Load reference lists once.
  useEffect(() => {
    (async () => {
      const [leadsRes, destRes] = await Promise.all([leadsApi.list({ pageSize: 1000 }), destinationsApi.all()]);
      if (leadsRes.success) setLeads(leadsRes.data.items);
      if (destRes.success) setDestinations(destRes.data);
    })();
  }, []);

  // Load campaigns whenever the destination changes (they're the "Itinerary Template" source).
  useEffect(() => {
    if (!destinationId) {
      setCampaigns([]);
      return;
    }
    packagesApi.list({ pageSize: 1000, filter: { destinationId } }).then((res) => {
      if (res.success) setCampaigns(res.data.items);
    });
  }, [destinationId]);

  // Prefill from ?leadId= when arriving from a Lead's "Create Quotation" button.
  useEffect(() => {
    if (id) return;
    const prefillLeadId = searchParams.get("leadId");
    if (!prefillLeadId) return;
    setLeadId(prefillLeadId);
    leadsApi.get(prefillLeadId).then((res) => {
      if (res.success && res.data) setDestinationId(res.data.destinationId);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Load existing quotation when editing.
  useEffect(() => {
    if (!id) return;
    (async () => {
      const res = await quotationsApi.get(id);
      if (res.success && res.data) {
        const q = res.data;
        setLeadId(q.leadId);
        setDestinationId(q.destinationId);
        setCampaignId(q.campaignId ?? "");
        setMarginPercent(q.marginPercent);
        setItems(q.items.length > 0 ? q.items : [emptyRow(0)]);
        setStatus(q.status);
        setShareToken(q.shareToken ?? null);
      } else {
        notify(res.message || "Unable to load quotation", "error");
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Selecting an Itinerary Template pre-loads default components (only for a fresh/empty builder).
  const applyTemplate = async (nextCampaignId: string) => {
    setCampaignId(nextCampaignId);
    if (!nextCampaignId) return;
    const onlyBlankRow = items.length === 1 && !items[0].detail && items[0].cost === 0;
    if (!onlyBlankRow) return;

    const res = await packagesApi.get(nextCampaignId);
    if (!res.success || !res.data) return;
    const campaign = res.data;
    const preset: AdminQuotationItem[] = [];
    if (campaign.packageCost > 0) {
      preset.push({ component: "Hotel", detail: `${campaign.name} package`, qty: 1, cost: campaign.packageCost, sortOrder: 0 });
    }
    if (campaign.insurancePrice > 0) {
      preset.push({ component: "Insurance", detail: "Travel insurance", qty: 1, cost: campaign.insurancePrice, sortOrder: 1 });
    }
    if (preset.length > 0) setItems(preset);
  };

  const updateItem = (index: number, patch: Partial<AdminQuotationItem>) => {
    setItems((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const addRow = () => setItems((rows) => [...rows, emptyRow(rows.length)]);
  const removeRow = (index: number) => setItems((rows) => (rows.length > 1 ? rows.filter((_, i) => i !== index) : rows));

  const totalCost = items.reduce((sum, r) => sum + r.qty * r.cost, 0);
  const marginValue = Math.round(totalCost * (marginPercent / 100));
  const sellingPrice = totalCost + marginValue;

  const canSave = !!leadId && !!destinationId;

  const buildPayload = () => ({
    leadId,
    destinationId,
    campaignId: campaignId || null,
    marginPercent,
    items: items.map((r, i) => ({ ...r, sortOrder: i })),
  });

  const save = async (): Promise<string | null> => {
    if (!canSave) {
      notify("Select a customer/lead and a destination first", "error");
      return null;
    }
    setSaving(true);
    try {
      if (id) {
        const res = await quotationsApi.update(id, buildPayload());
        if (!res.success) {
          notify(res.message || "Unable to save quotation", "error");
          return null;
        }
        notify("Quotation saved", "success");
        return id;
      }
      const res = await quotationsApi.create(buildPayload());
      if (!res.success || !res.data) {
        notify(res.message || "Unable to create quotation", "error");
        return null;
      }
      notify("Quotation created", "success");
      router.push(`/admin/quotations/${res.data.id}/edit`);
      return res.data.id;
    } finally {
      setSaving(false);
    }
  };

  const withBusy = async (key: string, fn: () => Promise<void>) => {
    setBusyAction(key);
    try {
      await fn();
    } finally {
      setBusyAction(null);
    }
  };

  const generatePdf = () =>
    withBusy("pdf", async () => {
      const savedId = await save();
      if (!savedId) return;
      window.open(`/api/admin/quotations/${savedId}/pdf`, "_blank");
    });

  const sendEmail = () =>
    withBusy("email", async () => {
      const savedId = await save();
      if (!savedId) return;
      const res = await quotationsApi.sendEmail(savedId);
      if (!res.success) return notify(res.message || "Unable to send email", "error");
      notify("Quotation emailed to the lead", "success");
      if (res.data) setStatus(res.data.status);
    });

  const generateLink = () =>
    withBusy("link", async () => {
      const savedId = await save();
      if (!savedId) return;
      const res = await quotationsApi.generateShareLink(savedId);
      if (!res.success || !res.data) return notify(res.message || "Unable to generate link", "error");
      setShareToken(res.data.token);
      setStatus("Sent");
      await navigator.clipboard.writeText(res.data.url).catch(() => {});
      notify("Shareable link copied to clipboard", "success");
    });

  const duplicate = () =>
    withBusy("duplicate", async () => {
      if (!id) return;
      const res = await quotationsApi.duplicate(id);
      if (!res.success || !res.data) return notify(res.message || "Unable to duplicate", "error");
      notify("Quotation duplicated", "success");
      router.push(`/admin/quotations/${res.data.id}/edit`);
    });

  if (loading) {
    return (
      <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center text-sm text-slate-500">
        Loading…
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_260px] gap-6">
      {/* Quotation Actions panel (left) */}
      <div className="rounded-2xl bg-white border border-slate-200 p-4 h-fit space-y-2 order-2 lg:order-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Actions</h3>
        <button
          type="button"
          onClick={generatePdf}
          disabled={busyAction !== null}
          className="w-full inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <FileDown className="w-4 h-4" /> Generate PDF
        </button>
        <button
          type="button"
          onClick={sendEmail}
          disabled={busyAction !== null}
          className="w-full inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <Mail className="w-4 h-4" /> Send Email
        </button>
        <button
          type="button"
          onClick={generateLink}
          disabled={busyAction !== null}
          className="w-full inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <Share2 className="w-4 h-4" /> Generate Shareable Link
        </button>
        {id && (
          <button
            type="button"
            onClick={duplicate}
            disabled={busyAction !== null}
            className="w-full inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <Copy className="w-4 h-4" /> Duplicate
          </button>
        )}
        {shareToken && (
          <Link
            href={`/quote/${shareToken}`}
            target="_blank"
            className="block text-center text-xs text-cyan-700 hover:underline pt-1"
          >
            View public link
          </Link>
        )}
      </div>

      {/* Main builder */}
      <div className="space-y-6 order-1 lg:order-2">
        <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-900">{id ? "Edit Quotation" : "New Quotation"}</h2>
            <div className="flex items-center gap-2">
              <Link href="/admin/leads" className="px-4 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100">
                Cancel
              </Link>
              <button
                type="button"
                onClick={() => save()}
                disabled={!canSave || saving}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 shadow-sm ${
                  !canSave || saving ? "opacity-50 cursor-not-allowed hover:bg-blue-600" : ""
                }`}
              >
                <Save className="w-4 h-4" /> Save Draft
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Customer / Lead" required>
                <select className={selectCls} value={leadId} onChange={(e) => setLeadId(e.target.value)}>
                  <option value="">Select lead</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      LD-{l.seq.toString().padStart(4, "0")} — {l.customerName}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Destination" required>
                <select
                  className={selectCls}
                  value={destinationId}
                  onChange={(e) => {
                    setDestinationId(e.target.value);
                    setCampaignId("");
                  }}
                >
                  <option value="">Select destination</option>
                  {destinations.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Itinerary Template" hint="Pre-loads default components">
                <select className={selectCls} value={campaignId} onChange={(e) => applyTemplate(e.target.value)} disabled={!destinationId}>
                  <option value="">No template</option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Costing Components</h3>
            <button
              type="button"
              onClick={addRow}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
            >
              <Plus className="w-3.5 h-3.5" /> Add Row
            </button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-slate-500 uppercase border-b border-slate-100">
                <th className="px-4 py-2 w-40">Component</th>
                <th className="px-4 py-2">Detail</th>
                <th className="px-4 py-2 w-20">Qty</th>
                <th className="px-4 py-2 w-32">Cost (INR)</th>
                <th className="px-4 py-2 w-10" />
              </tr>
            </thead>
            <tbody>
              {items.map((row, i) => (
                <tr key={i} className="border-b border-slate-50">
                  <td className="px-4 py-2">
                    <select
                      className={selectCls}
                      value={row.component}
                      onChange={(e) => updateItem(i, { component: e.target.value as QuotationComponentType })}
                    >
                      {COMPONENTS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <input className={inputCls} value={row.detail} onChange={(e) => updateItem(i, { detail: e.target.value })} placeholder="e.g. 4-star hotel, 3 nights" />
                  </td>
                  <td className="px-4 py-2">
                    <input type="number" min={1} className={inputCls} value={row.qty} onChange={(e) => updateItem(i, { qty: Number(e.target.value) || 1 })} />
                  </td>
                  <td className="px-4 py-2">
                    <input type="number" min={0} className={inputCls} value={row.cost} onChange={(e) => updateItem(i, { cost: Number(e.target.value) || 0 })} />
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button type="button" onClick={() => removeRow(i)} className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50" aria-label="Delete row">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Margin & Selling Price panel (right) */}
      <div className="rounded-2xl bg-white border border-slate-200 p-5 h-fit space-y-4 order-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Margin &amp; Selling Price</h3>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Total Cost</span>
          <span className="font-semibold text-slate-900">{formatINR(totalCost)}</span>
        </div>
        <Field label="Margin %">
          <input
            type="number"
            min={0}
            step={0.5}
            className={inputCls}
            value={marginPercent}
            onChange={(e) => setMarginPercent(Number(e.target.value) || 0)}
          />
        </Field>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Margin Value</span>
          <span className="font-semibold text-slate-900">{formatINR(marginValue)}</span>
        </div>
        <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
          <span className="text-sm font-bold text-slate-900">Selling Price</span>
          <span className="text-lg font-bold text-emerald-700">{formatINR(sellingPrice)}</span>
        </div>
        {id && (
          <div className="text-xs text-slate-400 pt-2 border-t border-slate-100">
            Status: <span className="font-semibold text-slate-600">{status}</span>
          </div>
        )}
      </div>
    </div>
  );
}
