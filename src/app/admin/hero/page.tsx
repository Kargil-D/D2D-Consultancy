"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import Breadcrumb from "@/components/admin/ui/Breadcrumb";
import ImageUpload from "@/components/admin/ui/ImageUpload";
import { Field, inputCls, textareaCls, selectCls } from "@/components/admin/ui/Field";
import { useToast } from "@/components/admin/ui/Toast";
import { destinationsApi, heroApi, packagesApi } from "@/lib/adminApi";
import type { AdminDestination, AdminHeroConfig, AdminPackage, Status } from "@/types/admin";
import { ChevronDown, ChevronUp, Save } from "lucide-react";

const defaults = (): Partial<AdminHeroConfig> => ({
  bannerText: "Plan Your Dream Vacation",
  subtitle: "Doorstep to dreamland — curated luxury escapes.",
  backgroundImage: "",
  backgroundVideo: "",
  ctaPrimaryText: "Plan Trip",
  ctaPrimaryLink: "/plan-trip",
  ctaSecondaryText: "Browse Campaigns",
  ctaSecondaryLink: "/#packages",
  searchDropdownDestinationIds: [],
  featuredCampaignIds: [],
  status: "Active",
});

export default function HeroAdminPage() {
  const { notify } = useToast();
  const [form, setForm] = useState<Partial<AdminHeroConfig>>(defaults());
  const [destinations, setDestinations] = useState<AdminDestination[]>([]);
  const [packages, setPackages] = useState<AdminPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [hero, d, p] = await Promise.all([heroApi.all(), destinationsApi.all(), packagesApi.all()]);
      if (hero.success && hero.data[0]) setForm(hero.data[0]);
      if (d.success) setDestinations(d.data);
      if (p.success) setPackages(p.data);
      setLoading(false);
    })();
  }, []);

  const set = (patch: Partial<AdminHeroConfig>) => setForm((f) => ({ ...f, ...patch }));

  const save = async () => {
    if (form.id) {
      await heroApi.update(form.id, form);
    } else {
      const created = await heroApi.create(form as Omit<AdminHeroConfig, "id">);
      if (created.success) setForm(created.data);
    }
    notify("Hero configuration saved");
  };

  const toggleDest = (id: string) => {
    const cur = form.searchDropdownDestinationIds ?? [];
    set({ searchDropdownDestinationIds: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] });
  };

  const toggleCampaign = (id: string) => {
    const cur = form.featuredCampaignIds ?? [];
    set({ featuredCampaignIds: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] });
  };

  const moveCampaign = (id: string, dir: -1 | 1) => {
    const cur = [...(form.featuredCampaignIds ?? [])];
    const idx = cur.indexOf(id);
    const ni = idx + dir;
    if (idx < 0 || ni < 0 || ni >= cur.length) return;
    [cur[idx], cur[ni]] = [cur[ni], cur[idx]];
    set({ featuredCampaignIds: cur });
  };

  if (loading) return <AdminShell title="Hero Section"><div className="p-8 text-center text-slate-500">Loading…</div></AdminShell>;

  return (
    <AdminShell title="Hero Section">
      <Breadcrumb items={[{ label: "PM", href: "/admin/pm" }, { label: "Hero Section" }]} />

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hero Section</h1>
          <p className="text-sm text-slate-500 mt-0.5">Controls the homepage hero banner, search destinations and featured campaigns.</p>
        </div>
        <button onClick={save} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 shadow-sm">
          <Save className="w-4 h-4" /> Save Configuration
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title="Banner Content">
          <Field label="Banner Heading">
            <input className={inputCls} value={form.bannerText ?? ""} onChange={(e) => set({ bannerText: e.target.value })} />
          </Field>
          <Field label="Subtitle">
            <textarea className={textareaCls} value={form.subtitle ?? ""} onChange={(e) => set({ subtitle: e.target.value })} />
          </Field>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Background Image">
              <ImageUpload value={form.backgroundImage} onChange={(url) => set({ backgroundImage: url })} aspect="16/9" />
            </Field>
            <Field label="Background Video URL (optional)">
              <input className={inputCls} value={form.backgroundVideo ?? ""} onChange={(e) => set({ backgroundVideo: e.target.value })} placeholder="https://…mp4" />
            </Field>
          </div>
        </Section>

        <Section title="CTA Buttons">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Primary CTA Text">
              <input className={inputCls} value={form.ctaPrimaryText ?? ""} onChange={(e) => set({ ctaPrimaryText: e.target.value })} />
            </Field>
            <Field label="Primary CTA Link">
              <input className={inputCls} value={form.ctaPrimaryLink ?? ""} onChange={(e) => set({ ctaPrimaryLink: e.target.value })} />
            </Field>
            <Field label="Secondary CTA Text">
              <input className={inputCls} value={form.ctaSecondaryText ?? ""} onChange={(e) => set({ ctaSecondaryText: e.target.value })} />
            </Field>
            <Field label="Secondary CTA Link">
              <input className={inputCls} value={form.ctaSecondaryLink ?? ""} onChange={(e) => set({ ctaSecondaryLink: e.target.value })} />
            </Field>
          </div>
          <Field label="Status">
            <select className={selectCls} value={form.status ?? "Active"} onChange={(e) => set({ status: e.target.value as Status })}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </Field>
        </Section>

        <Section title="Search Dropdown Destinations">
          <p className="text-xs text-slate-500 mb-3">Pick destinations shown in the hero search dropdown. Leave empty to show all.</p>
          <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto">
            {destinations.length === 0 && <p className="text-sm text-slate-500">Add destinations first.</p>}
            {destinations.map((d) => {
              const active = form.searchDropdownDestinationIds?.includes(d.id);
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => toggleDest(d.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                    active ? "bg-cyan-600 text-white border-cyan-600" : "bg-white text-slate-600 border-slate-200 hover:border-cyan-400"
                  }`}
                >
                  {d.name}
                </button>
              );
            })}
          </div>
        </Section>

        <Section title="Featured Hero Campaigns">
          <p className="text-xs text-slate-500 mb-3">Order controls display order in the hero campaigns rail.</p>
          {packages.length === 0 && <p className="text-sm text-slate-500">Add campaigns first.</p>}
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {packages.map((p) => {
              const active = form.featuredCampaignIds?.includes(p.id);
              const order = form.featuredCampaignIds?.indexOf(p.id) ?? -1;
              return (
                <div key={p.id} className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border ${active ? "bg-blue-50 border-blue-200" : "bg-white border-slate-200"}`}>
                  <label className="flex items-center gap-2 text-sm flex-1">
                    <input type="checkbox" checked={!!active} onChange={() => toggleCampaign(p.id)} className="w-4 h-4 rounded" />
                    <span className="font-medium text-slate-900">{p.name}</span>
                    {active && <span className="text-xs text-blue-700 font-semibold">#{order + 1}</span>}
                  </label>
                  {active && (
                    <div className="flex gap-1">
                      <button type="button" onClick={() => moveCampaign(p.id, -1)} className="p-0.5 rounded bg-white border border-slate-200" aria-label="Move up">
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={() => moveCampaign(p.id, 1)} className="p-0.5 rounded bg-white border border-slate-200" aria-label="Move down">
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Section>
      </div>
    </AdminShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 space-y-4">
      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">{title}</h3>
      {children}
    </div>
  );
}
