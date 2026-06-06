"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type {
  HotelOption,
  ActivityOption,
  TransferOption,
  FeatureBadge,
  ItineraryContent,
} from "@/services/itineraryService";
import { saveItineraryAction } from "@/app/admin/packages/actions";

interface PackageFormProps {
  initial?: ItineraryContent;
}

const TABS = [
  "Basic Info",
  "Itinerary",
  "Hotels",
  "Activities",
  "Transfers",
  "Pricing",
  "Inclusions",
  "Terms",
] as const;
type Tab = (typeof TABS)[number];

const MEAL_PLANS = ["BB", "HB", "FB", "AI"] as const;

/**
 * Tabbed package editor ï¿½ writes to a markdown file via a Server Action.
 * Mirrors the screenshot's Admin/Backend "Create / Edit Package" screen.
 */
export default function PackageForm({ initial }: PackageFormProps) {
  const [tab, setTab] = useState<Tab>("Basic Info");

  // Top-level scalar fields kept locally for the few that drive previews.
  const [image, setImage] = useState(initial?.image ?? "");
  const [hotels, setHotels] = useState<HotelOption[]>(initial?.hotels ?? []);
  const [activities, setActivities] = useState<ActivityOption[]>(initial?.activities ?? []);
  const [transfers, setTransfers] = useState<TransferOption[]>(initial?.transfers ?? []);
  const [features, setFeatures] = useState<FeatureBadge[]>(
    initial?.features ?? [
      { label: "All Transfers", icon: "Plane" },
      { label: "All Inclusive", icon: "Sparkles" },
    ],
  );

  const addHotel = () =>
    setHotels([
      ...hotels,
      { name: "", roomType: "", nights: 1, mealPlan: "BB", image: "" },
    ]);
  const addActivity = () =>
    setActivities([...activities, { title: "", icon: "Sparkles" }]);
  const addTransfer = () =>
    setTransfers([...transfers, { from: "", to: "", type: "Cab", icon: "Plane" }]);
  const addFeature = () =>
    setFeatures([...features, { label: "", icon: "Sparkles" }]);

  return (
    <form action={saveItineraryAction} className="space-y-6">
      {/* Hidden JSON arrays sent to the server action */}
      <input type="hidden" name="hotels" value={JSON.stringify(hotels)} />
      <input type="hidden" name="activities" value={JSON.stringify(activities)} />
      <input type="hidden" name="transfers" value={JSON.stringify(transfers)} />
      <input type="hidden" name="features" value={JSON.stringify(features)} />

      <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Create / Edit Package</h2>
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
          >
            Save Package
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 px-6 overflow-x-auto">
          <div className="flex items-center gap-1 min-w-max">
            {TABS.map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  tab === t
                    ? "border-blue-600 text-blue-700"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {tab === "Basic Info" && (
            <BasicInfo initial={initial} image={image} setImage={setImage} features={features} setFeatures={setFeatures} addFeature={addFeature} />
          )}
          {tab === "Itinerary" && <ItineraryEditor initial={initial} />}
          {tab === "Hotels" && (
            <HotelsEditor hotels={hotels} setHotels={setHotels} addHotel={addHotel} />
          )}
          {tab === "Activities" && (
            <ActivitiesEditor activities={activities} setActivities={setActivities} addActivity={addActivity} />
          )}
          {tab === "Transfers" && (
            <TransfersEditor transfers={transfers} setTransfers={setTransfers} addTransfer={addTransfer} />
          )}
          {tab === "Pricing" && <PricingEditor initial={initial} />}
          {tab === "Inclusions" && <InclusionsEditor initial={initial} />}
          {tab === "Terms" && (
            <p className="text-sm text-slate-500">
              Terms & conditions section is documented in
              <code className="mx-1">ARCHITECTURE.md ï¿½7.4</code>and will be wired
              into the next iteration.
            </p>
          )}
        </div>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/*  Tab sub-components                                                         */
/* -------------------------------------------------------------------------- */

function field(label: string, child: React.ReactNode) {
  return (
    <label className="block">
      <span className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </span>
      {child}
    </label>
  );
}

const input =
  "w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

function BasicInfo({
  initial,
  image,
  setImage,
  features,
  setFeatures,
  addFeature,
}: {
  initial?: ItineraryContent;
  image: string;
  setImage: (s: string) => void;
  features: FeatureBadge[];
  setFeatures: (f: FeatureBadge[]) => void;
  addFeature: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {field("Package Name *", (
          <input name="title" required defaultValue={initial?.title} placeholder="Maldives Luxury Escape 4N/5D" className={input} />
        ))}
        {field("Destination *", (
          <input name="destination" required defaultValue={initial?.destination} placeholder="Maldives" className={input} />
        ))}
        {field("URL Slug (auto if empty)", (
          <input name="id" defaultValue={initial?.id} placeholder="maldives-luxury-escape" className={input} />
        ))}
        {field("Primary Location", (
          <input name="primaryLocation" defaultValue={initial?.primaryLocation} placeholder="Maldives" className={input} />
        ))}
        {field("Nights *", (
          <input type="number" name="nights" required defaultValue={initial?.nights ?? 4} min={1} className={input} />
        ))}
        {field("Extra Stops", (
          <input type="number" name="extraStops" defaultValue={initial?.extraStops ?? 0} min={0} className={input} />
        ))}
        {field("Audience", (
          <select name="audience" defaultValue={initial?.audience ?? "COUPLE"} className={input}>
            <option value="COUPLE">Couple</option>
            <option value="FAMILY">Family</option>
            <option value="FRIENDS">Friends</option>
            <option value="SOLO">Solo</option>
          </select>
        ))}
        {field("Price Bucket", (
          <select name="bucket" defaultValue={initial?.bucket ?? "Luxury"} className={input}>
            <option>Under 50K</option>
            <option>50K to 1.5L</option>
            <option>1.5L to 2.5L</option>
            <option>Luxury</option>
          </select>
        ))}
        {field("Rating (0-5)", (
          <input type="number" step={0.1} name="rating" defaultValue={initial?.rating ?? 4.8} min={0} max={5} className={input} />
        ))}
        {field("Review count", (
          <input type="number" name="reviews" defaultValue={initial?.reviews ?? 120} min={0} className={input} />
        ))}
      </div>
      {field("Tagline (short)", (
        <input name="tagline" defaultValue={initial?.tagline} placeholder="Where the ocean meets paradise" className={input} />
      ))}

      {field("Banner Image URL *", (
        <div className="space-y-2">
          <input
            name="image"
            required
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="https://images.unsplash.com/..."
            className={input}
          />
          {image && (
            <div className="rounded-xl overflow-hidden border border-slate-200 w-full max-w-md aspect-[16/9] bg-slate-100">
              <img src={image} alt="Banner preview" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      ))}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {field("Booked By Name", (
          <input name="bookedByName" defaultValue={initial?.bookedBy.name ?? "Aditi"} className={input} />
        ))}
        {field("Booked By City", (
          <input name="bookedByCity" defaultValue={initial?.bookedBy.city ?? "Mumbai"} className={input} />
        ))}
        {field("Booked Ago", (
          <input name="bookedByAgo" defaultValue={initial?.bookedBy.ago ?? "12m ago"} className={input} />
        ))}
      </div>

      {/* Feature chips */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Feature Chips (under hero)
          </span>
          <button type="button" onClick={addFeature} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700">
            <Plus className="w-3.5 h-3.5" />Add
          </button>
        </div>
        <div className="space-y-2">
          {features.map((f, i) => (
            <div key={i} className="grid grid-cols-[1fr_140px_auto] gap-2">
              <input value={f.label} onChange={(e) => { const next = [...features]; next[i] = { ...f, label: e.target.value }; setFeatures(next); }} placeholder="Label" className={input} />
              <input value={f.icon ?? ""} onChange={(e) => { const next = [...features]; next[i] = { ...f, icon: e.target.value }; setFeatures(next); }} placeholder="Icon name" className={input} />
              <button type="button" onClick={() => setFeatures(features.filter((_, j) => j !== i))} className="p-2 rounded-lg text-rose-600 hover:bg-rose-50">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ItineraryEditor({ initial }: { initial?: ItineraryContent }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500">
        Author the full day-by-day plan + inclusions / exclusions using markdown.
        Convention: <code>## Day N - Title</code>, bullets with <code>**HH:MM AM/PM**</code> times,
        then <code>## Inclusions</code> and <code>## Exclusions</code> sections.
      </p>
      <textarea
        name="body"
        rows={26}
        defaultValue={initial?.bodyMarkdown ?? `# Title

## Day 1 - Arrival
- **10:00 AM** Arrival at airport
- **12:00 PM** Hotel check-in

## Inclusions
- Accommodation
- Daily breakfast

## Exclusions
- Airfare
`}
        className="w-full px-4 py-3 rounded-xl border border-slate-300 font-mono text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

function HotelsEditor({
  hotels, setHotels, addHotel,
}: { hotels: HotelOption[]; setHotels: (h: HotelOption[]) => void; addHotel: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Add hotels with image, room type and meal plan.</p>
        <button type="button" onClick={addHotel} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700">
          <Plus className="w-3.5 h-3.5" />Add Hotel
        </button>
      </div>
      {hotels.length === 0 && <EmptyState text="No hotels yet." />}
      {hotels.map((h, i) => (
        <div key={i} className="rounded-xl border border-slate-200 p-4 bg-slate-50/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input value={h.name} onChange={(e) => { const next = [...hotels]; next[i] = { ...h, name: e.target.value }; setHotels(next); }} placeholder="Hotel name" className={input} />
            <input value={h.area ?? ""} onChange={(e) => { const next = [...hotels]; next[i] = { ...h, area: e.target.value }; setHotels(next); }} placeholder="Area / sub-title" className={input} />
            <input value={h.roomType} onChange={(e) => { const next = [...hotels]; next[i] = { ...h, roomType: e.target.value }; setHotels(next); }} placeholder="Room type" className={input} />
            <div className="grid grid-cols-2 gap-3">
              <input type="number" min={1} value={h.nights} onChange={(e) => { const next = [...hotels]; next[i] = { ...h, nights: Number(e.target.value) }; setHotels(next); }} placeholder="Nights" className={input} />
              <select value={h.mealPlan} onChange={(e) => { const next = [...hotels]; next[i] = { ...h, mealPlan: e.target.value as HotelOption["mealPlan"] }; setHotels(next); }} className={input}>
                {MEAL_PLANS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <input value={h.image ?? ""} onChange={(e) => { const next = [...hotels]; next[i] = { ...h, image: e.target.value }; setHotels(next); }} placeholder="Image URL" className={`${input} md:col-span-2`} />
          </div>
          <div className="mt-3 text-right">
            <button type="button" onClick={() => setHotels(hotels.filter((_, j) => j !== i))} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs text-rose-600 hover:bg-rose-50">
              <Trash2 className="w-3.5 h-3.5" />Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function ActivitiesEditor({
  activities, setActivities, addActivity,
}: { activities: ActivityOption[]; setActivities: (a: ActivityOption[]) => void; addActivity: () => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Icons use lucide-react names: Anchor, Waves, Compass, Fish, Heart, Sparkles, Plane, Sailboat, Calendar, Home.</p>
        <button type="button" onClick={addActivity} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700">
          <Plus className="w-3.5 h-3.5" />Add Activity
        </button>
      </div>
      {activities.length === 0 && <EmptyState text="No activities yet." />}
      {activities.map((a, i) => (
        <div key={i} className="grid grid-cols-[1fr_180px_auto] gap-2">
          <input value={a.title} onChange={(e) => { const next = [...activities]; next[i] = { ...a, title: e.target.value }; setActivities(next); }} placeholder="Title" className={input} />
          <input value={a.icon ?? ""} onChange={(e) => { const next = [...activities]; next[i] = { ...a, icon: e.target.value }; setActivities(next); }} placeholder="Icon name" className={input} />
          <button type="button" onClick={() => setActivities(activities.filter((_, j) => j !== i))} className="p-2 rounded-lg text-rose-600 hover:bg-rose-50">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

function TransfersEditor({
  transfers, setTransfers, addTransfer,
}: { transfers: TransferOption[]; setTransfers: (t: TransferOption[]) => void; addTransfer: () => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Each transfer row: from / type / icon.</p>
        <button type="button" onClick={addTransfer} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700">
          <Plus className="w-3.5 h-3.5" />Add Transfer
        </button>
      </div>
      {transfers.length === 0 && <EmptyState text="No transfers yet." />}
      {transfers.map((t, i) => (
        <div key={i} className="grid grid-cols-[1fr_180px_140px_auto] gap-2">
          <input value={t.from} onChange={(e) => { const next = [...transfers]; next[i] = { ...t, from: e.target.value }; setTransfers(next); }} placeholder="From ? To (e.g. Airport to Hotel)" className={input} />
          <input value={t.type} onChange={(e) => { const next = [...transfers]; next[i] = { ...t, type: e.target.value }; setTransfers(next); }} placeholder="Speedboat" className={input} />
          <input value={t.icon ?? ""} onChange={(e) => { const next = [...transfers]; next[i] = { ...t, icon: e.target.value }; setTransfers(next); }} placeholder="Icon" className={input} />
          <button type="button" onClick={() => setTransfers(transfers.filter((_, j) => j !== i))} className="p-2 rounded-lg text-rose-600 hover:bg-rose-50">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

function PricingEditor({ initial }: { initial?: ItineraryContent }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {field("Per-Person Price (INR) *", (
        <input type="number" name="price" required defaultValue={initial?.price ?? 125000} className={input} />
      ))}
      {field("Total Package Cost (pre-GST)", (
        <input type="number" name="totalPackageCost" defaultValue={initial?.pricing?.totalPackageCost ?? 119048} className={input} />
      ))}
      {field("GST %", (
        <input type="number" step={0.5} name="gstPct" defaultValue={initial?.pricing?.gstPct ?? 5} className={input} />
      ))}
      {field("Total Amount (auto if empty)", (
        <input type="number" name="totalAmount" defaultValue={initial?.pricing?.totalAmount ?? 0} className={input} />
      ))}
    </div>
  );
}

function InclusionsEditor({ initial: _initial }: { initial?: ItineraryContent }) {
  return (
    <p className="text-sm text-slate-500">
      Inclusions and Exclusions live inside the markdown body under
      <code className="mx-1">## Inclusions</code>and<code className="mx-1">## Exclusions</code>.
      Edit them in the <b>Itinerary</b> tab.
    </p>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
      {text}
    </div>
  );
}
