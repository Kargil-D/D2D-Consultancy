"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Edit, Trash2, GripVertical, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import Breadcrumb from "@/components/admin/ui/Breadcrumb";
import DataTable, { type Column } from "@/components/admin/ui/DataTable";
import Pagination from "@/components/admin/ui/Pagination";
import Drawer from "@/components/admin/ui/Drawer";
import ConfirmModal from "@/components/admin/ui/ConfirmModal";
import StatusToggle, { StatusBadge } from "@/components/admin/ui/StatusToggle";
import ImageUpload from "@/components/admin/ui/ImageUpload";
import TagInput from "@/components/admin/ui/TagInput";
import { Field, inputCls, textareaCls, selectCls } from "@/components/admin/ui/Field";
import { useToast } from "@/components/admin/ui/Toast";
import { itinerariesApi, packagesApi } from "@/lib/adminApi";
import type { AdminItinerary, AdminPackage, ItineraryDayDetail, Status } from "@/types/admin";

const PAGE_SIZE = 10;
const TABS = ["Overview", "Days", "Inclusions", "Terms", "FAQs", "Gallery"] as const;
type Tab = (typeof TABS)[number];

const newDay = (n: number): ItineraryDayDetail => ({
  id: `${Date.now()}-${n}`,
  dayNumber: n,
  title: `Day ${n}`,
  description: "",
  activities: [],
  mealsIncluded: [],
  stayDetails: "",
  transportDetails: "",
  dayImage: "",
  order: n,
});

const emptyForm = (): Partial<AdminItinerary> => ({
  packageId: "",
  title: "",
  overview: "",
  totalDays: 1,
  days: [newDay(1)],
  packageIncludes: [],
  packageExcludes: [],
  termsAndConditions: "",
  cancellationPolicy: "",
  faqs: [],
  galleryImages: [],
  mapLocation: "",
  customerNotes: "",
  ctaButtonText: "Send Enquiry",
  ctaRedirect: "/plan-trip",
  status: "Active",
  isPublished: false,
});

export default function ItinerariesAdminPage() {
  const { notify } = useToast();
  const [rows, setRows] = useState<AdminItinerary[]>([]);
  const [packages, setPackages] = useState<AdminPackage[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [drawer, setDrawer] = useState<{ open: boolean; form: Partial<AdminItinerary>; tab: Tab }>({
    open: false,
    form: emptyForm(),
    tab: "Overview",
  });
  const [confirm, setConfirm] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    const [list, pkg] = await Promise.all([
      itinerariesApi.list({ search, page, pageSize: PAGE_SIZE }),
      packagesApi.all(),
    ]);
    setLoading(false);
    if (list.success) {
      setRows(list.data.items);
      setTotal(list.data.total);
    }
    if (pkg.success) setPackages(pkg.data);
  }, [search, page]);

  useEffect(() => { reload(); }, [reload]);

  const packageName = (id: string) => packages.find((p) => p.id === id)?.name ?? "—";

  const openCreate = () => setDrawer({ open: true, form: emptyForm(), tab: "Overview" });
  const openEdit = (row: AdminItinerary) => setDrawer({ open: true, form: { ...row }, tab: "Overview" });

  const setForm = (patch: Partial<AdminItinerary>) =>
    setDrawer((d) => ({ ...d, form: { ...d.form, ...patch } }));

  const save = async () => {
    const f = drawer.form;
    if (!f.title || !f.packageId) return notify("Title and linked package are required", "error");
    const payload = { ...f, totalDays: f.days?.length ?? 0 };
    if (f.id) {
      await itinerariesApi.update(f.id, payload);
      notify("Itinerary updated");
    } else {
      await itinerariesApi.create(payload as Omit<AdminItinerary, "id">);
      notify("Itinerary created");
    }
    setDrawer({ open: false, form: emptyForm(), tab: "Overview" });
    reload();
  };

  const remove = async () => {
    if (!confirm.id) return;
    await itinerariesApi.remove(confirm.id);
    notify("Itinerary deleted");
    setConfirm({ open: false, id: null });
    reload();
  };

  const toggleStatus = async (id: string) => {
    await itinerariesApi.toggleStatus(id);
    reload();
  };

  const columns: Column<AdminItinerary>[] = [
    { key: "title", label: "Title", render: (r) => <div className="font-semibold text-slate-900 text-sm">{r.title}</div> },
    { key: "packageId", label: "Linked Package", render: (r) => packageName(r.packageId) },
    { key: "totalDays", label: "Days", render: (r) => `${r.days?.length ?? 0} days` },
    {
      key: "published",
      label: "Published",
      render: (r) => (
        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${r.isPublished ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
          {r.isPublished ? "Live" : "Draft"}
        </span>
      ),
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
    <AdminShell title="Itineraries">
      <Breadcrumb items={[{ label: "PM", href: "/admin/pm" }, { label: "Itineraries" }]} />
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Itineraries</h1>
          <p className="text-sm text-slate-500 mt-0.5">Day-wise itinerary pages with rich content. Linked to packages.</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 shadow-sm">
          <Plus className="w-4 h-4" /> Add Itinerary
        </button>
      </div>

      <DataTable<AdminItinerary>
        columns={columns} rows={rows} loading={loading} rowKey={(r) => r.id}
        search={search} onSearchChange={(v) => { setPage(1); setSearch(v); }}
        searchPlaceholder="Search itineraries…"
      />
      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />

      <Drawer
        open={drawer.open}
        title={drawer.form.id ? "Edit Itinerary" : "New Itinerary"}
        onClose={() => setDrawer({ open: false, form: emptyForm(), tab: "Overview" })}
        width="xl"
        footer={
          <>
            <button onClick={() => setDrawer({ open: false, form: emptyForm(), tab: "Overview" })} className="px-4 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100">Cancel</button>
            <button onClick={save} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700">
              {drawer.form.id ? "Update" : "Create"}
            </button>
          </>
        }
      >
        <div className="border-b border-slate-200 mb-4 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setDrawer((d) => ({ ...d, tab: t }))}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  drawer.tab === t ? "border-blue-600 text-blue-700" : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {drawer.tab === "Overview" && <OverviewTab form={drawer.form} packages={packages} setForm={setForm} />}
        {drawer.tab === "Days" && <DaysTab form={drawer.form} setForm={setForm} />}
        {drawer.tab === "Inclusions" && <InclusionsTab form={drawer.form} setForm={setForm} />}
        {drawer.tab === "Terms" && <TermsTab form={drawer.form} setForm={setForm} />}
        {drawer.tab === "FAQs" && <FAQTab form={drawer.form} setForm={setForm} />}
        {drawer.tab === "Gallery" && <GalleryTab form={drawer.form} setForm={setForm} />}
      </Drawer>

      <ConfirmModal
        open={confirm.open} title="Delete itinerary?" message="This will remove the itinerary permanently."
        confirmText="Delete" onCancel={() => setConfirm({ open: false, id: null })} onConfirm={remove}
      />
    </AdminShell>
  );
}

/* ---------------- Tabs ---------------- */

function OverviewTab({ form, packages, setForm }: { form: Partial<AdminItinerary>; packages: AdminPackage[]; setForm: (p: Partial<AdminItinerary>) => void }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Itinerary Title" required>
          <input className={inputCls} value={form.title ?? ""} onChange={(e) => setForm({ title: e.target.value })} />
        </Field>
        <Field label="Linked Package" required>
          <select className={selectCls} value={form.packageId ?? ""} onChange={(e) => setForm({ packageId: e.target.value })}>
            <option value="">Select package</option>
            {packages.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>
        <Field label="CTA Button Text">
          <input className={inputCls} value={form.ctaButtonText ?? ""} onChange={(e) => setForm({ ctaButtonText: e.target.value })} />
        </Field>
        <Field label="CTA Redirect">
          <input className={inputCls} value={form.ctaRedirect ?? ""} onChange={(e) => setForm({ ctaRedirect: e.target.value })} />
        </Field>
        <Field label="Map Location URL">
          <input className={inputCls} value={form.mapLocation ?? ""} onChange={(e) => setForm({ mapLocation: e.target.value })} placeholder="https://maps.google.com/…" />
        </Field>
        <Field label="Status">
          <select className={selectCls} value={form.status ?? "Active"} onChange={(e) => setForm({ status: e.target.value as Status })}>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </Field>
      </div>
      <Field label="Overview">
        <textarea className={textareaCls} value={form.overview ?? ""} onChange={(e) => setForm({ overview: e.target.value })} rows={4} />
      </Field>
      <Field label="Customer Notes">
        <textarea className={textareaCls} value={form.customerNotes ?? ""} onChange={(e) => setForm({ customerNotes: e.target.value })} />
      </Field>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={!!form.isPublished} onChange={(e) => setForm({ isPublished: e.target.checked })} className="w-4 h-4 rounded" />
        Publish to live site
      </label>
    </div>
  );
}

function DaysTab({ form, setForm }: { form: Partial<AdminItinerary>; setForm: (p: Partial<AdminItinerary>) => void }) {
  const days = form.days ?? [];
  const update = (idx: number, patch: Partial<ItineraryDayDetail>) => {
    const next = [...days];
    next[idx] = { ...next[idx], ...patch };
    setForm({ days: next });
  };
  const add = () => setForm({ days: [...days, newDay(days.length + 1)] });
  const remove = (idx: number) => {
    const next = days.filter((_, i) => i !== idx).map((d, i) => ({ ...d, dayNumber: i + 1, order: i + 1 }));
    setForm({ days: next });
  };
  const move = (idx: number, dir: -1 | 1) => {
    const ni = idx + dir;
    if (ni < 0 || ni >= days.length) return;
    const next = [...days];
    [next[idx], next[ni]] = [next[ni], next[idx]];
    setForm({ days: next.map((d, i) => ({ ...d, dayNumber: i + 1, order: i + 1 })) });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-xs text-slate-500">Use arrows to reorder days. Day numbers auto-update.</p>
        <button type="button" onClick={add} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold">
          <Plus className="w-3.5 h-3.5" /> Add Day
        </button>
      </div>
      {days.map((d, i) => (
        <div key={d.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-slate-400" />
              <span className="font-bold text-slate-900">Day {d.dayNumber}</span>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => move(i, -1)} className="p-1.5 rounded text-slate-500 hover:bg-slate-200" disabled={i === 0}><ChevronUp className="w-3.5 h-3.5" /></button>
              <button type="button" onClick={() => move(i, 1)} className="p-1.5 rounded text-slate-500 hover:bg-slate-200" disabled={i === days.length - 1}><ChevronDown className="w-3.5 h-3.5" /></button>
              <button type="button" onClick={() => remove(i)} className="p-1.5 rounded text-rose-600 hover:bg-rose-50"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Day Title">
              <input className={inputCls} value={d.title} onChange={(e) => update(i, { title: e.target.value })} />
            </Field>
            <Field label="Day Image">
              <ImageUpload value={d.dayImage} onChange={(url) => update(i, { dayImage: url })} aspect="4/3" />
            </Field>
          </div>
          <Field label="Description">
            <textarea className={textareaCls} value={d.description} onChange={(e) => update(i, { description: e.target.value })} />
          </Field>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <Field label="Activities">
              <TagInput value={d.activities} onChange={(v) => update(i, { activities: v })} placeholder="Snorkeling" />
            </Field>
            <Field label="Meals Included">
              <TagInput value={d.mealsIncluded} onChange={(v) => update(i, { mealsIncluded: v })} placeholder="Breakfast, Dinner" />
            </Field>
            <Field label="Stay Details">
              <input className={inputCls} value={d.stayDetails} onChange={(e) => update(i, { stayDetails: e.target.value })} />
            </Field>
            <Field label="Transport Details">
              <input className={inputCls} value={d.transportDetails} onChange={(e) => update(i, { transportDetails: e.target.value })} />
            </Field>
          </div>
        </div>
      ))}
      {days.length === 0 && <p className="text-center py-8 text-sm text-slate-500">No days yet. Click &quot;Add Day&quot; to begin.</p>}
    </div>
  );
}

function InclusionsTab({ form, setForm }: { form: Partial<AdminItinerary>; setForm: (p: Partial<AdminItinerary>) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Package Includes">
        <TagInput value={form.packageIncludes ?? []} onChange={(v) => setForm({ packageIncludes: v })} placeholder="Airport pickup" />
      </Field>
      <Field label="Package Excludes">
        <TagInput value={form.packageExcludes ?? []} onChange={(v) => setForm({ packageExcludes: v })} placeholder="Visa fees" />
      </Field>
    </div>
  );
}

function TermsTab({ form, setForm }: { form: Partial<AdminItinerary>; setForm: (p: Partial<AdminItinerary>) => void }) {
  return (
    <div className="space-y-4">
      <Field label="Terms & Conditions" hint="Plain text or HTML">
        <textarea className={`${textareaCls} min-h-[160px]`} value={form.termsAndConditions ?? ""} onChange={(e) => setForm({ termsAndConditions: e.target.value })} />
      </Field>
      <Field label="Cancellation Policy">
        <textarea className={`${textareaCls} min-h-[160px]`} value={form.cancellationPolicy ?? ""} onChange={(e) => setForm({ cancellationPolicy: e.target.value })} />
      </Field>
    </div>
  );
}

function FAQTab({ form, setForm }: { form: Partial<AdminItinerary>; setForm: (p: Partial<AdminItinerary>) => void }) {
  const faqs = form.faqs ?? [];
  const update = (i: number, patch: Partial<(typeof faqs)[number]>) => {
    const next = [...faqs];
    next[i] = { ...next[i], ...patch };
    setForm({ faqs: next });
  };
  const add = () => setForm({ faqs: [...faqs, { question: "", answer: "" }] });
  const remove = (i: number) => setForm({ faqs: faqs.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button type="button" onClick={add} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold">
          <Plus className="w-3.5 h-3.5" /> Add FAQ
        </button>
      </div>
      {faqs.map((q, i) => (
        <div key={i} className="rounded-xl border border-slate-200 p-3 bg-slate-50/50">
          <div className="flex justify-between items-start gap-2 mb-2">
            <input className={inputCls} placeholder="Question" value={q.question} onChange={(e) => update(i, { question: e.target.value })} />
            <button type="button" onClick={() => remove(i)} className="p-2 rounded text-rose-600 hover:bg-rose-50"><Trash2 className="w-4 h-4" /></button>
          </div>
          <textarea className={textareaCls} placeholder="Answer" value={q.answer} onChange={(e) => update(i, { answer: e.target.value })} />
        </div>
      ))}
      {faqs.length === 0 && <p className="text-center py-8 text-sm text-slate-500">No FAQs yet.</p>}
    </div>
  );
}

function GalleryTab({ form, setForm }: { form: Partial<AdminItinerary>; setForm: (p: Partial<AdminItinerary>) => void }) {
  const images = form.galleryImages ?? [];
  const removeImg = (i: number) => setForm({ galleryImages: images.filter((_, idx) => idx !== i) });
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {images.map((url, i) => (
          <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`gallery-${i}`} className="w-full h-full object-cover" />
            <button type="button" onClick={() => removeImg(i)} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white/90 text-rose-600 flex items-center justify-center shadow"><Trash2 className="w-3 h-3" /></button>
          </div>
        ))}
        <div className="aspect-square">
          <ImageUpload value="" onChange={(url) => url && setForm({ galleryImages: [...images, url] })} label="Add image" aspect="square" />
        </div>
      </div>
      {form.mapLocation && (
        <a href={form.mapLocation} target="_blank" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
          <ExternalLink className="w-3.5 h-3.5" /> Open map
        </a>
      )}
    </div>
  );
}
