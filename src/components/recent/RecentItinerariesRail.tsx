"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ChevronDown, MapPin } from "lucide-react";
import { formatINR } from "@/utils/format";

export type PriceBucket =
  | "Under 50K"
  | "50K to 1.5L"
  | "1.5L to 2.5L"
  | "Luxury";

export type ItineraryAudience = "FAMILY" | "COUPLE" | "FRIENDS" | "SOLO";

export interface RecentItineraryCard {
  id: string;
  title: string;
  destination: string;
  primaryLocation: string;
  extraStops: number;
  audience: ItineraryAudience;
  price: number;
  nights: number;
  image: string;
  bookedBy: { name: string; city: string; ago: string };
  bucket: PriceBucket;
  /** When true the "Unlock Details" CTA links to /plan-trip pre-filled with this destination. */
  active: boolean;
  /** This campaign's own detail page — the lead form returns here after submission instead of the generic destination listing. */
  detailsUrl: string;
}

interface RecentItinerariesRailProps {
  items: RecentItineraryCard[];
}

const PRICE_FILTERS: PriceBucket[] = [
  "Under 50K",
  "50K to 1.5L",
  "1.5L to 2.5L",
  "Luxury",
];

const AVATAR_COLORS = [
  "bg-amber-500",
  "bg-violet-500",
  "bg-rose-500",
  "bg-emerald-500",
  "bg-sky-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-teal-500",
];

export default function RecentItinerariesRail({
  items,
}: RecentItinerariesRailProps) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const [bucket, setBucket] = useState<PriceBucket | "All">("All");
  const [destinationOpen, setDestinationOpen] = useState(false);
  const [destination, setDestination] = useState<string | "All">("All");

  const destinations = useMemo(() => {
    const set = new Set(items.map((i) => i.destination));
    return Array.from(set).sort();
  }, [items]);

  const visible = useMemo<RecentItineraryCard[]>(() => {
    return items.filter((i) => {
      if (bucket !== "All" && i.bucket !== bucket) return false;
      if (destination !== "All" && i.destination !== destination) return false;
      return true;
    });
  }, [items, bucket, destination]);

  const scrollByCard = (dir: 1 | -1) => {
    const el = railRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-itin-card]");
    const step = card ? card.offsetWidth + 24 : el.clientWidth * 0.9;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  return (
    <section
      id="recently-booked"
      className="relative overflow-hidden bg-gradient-to-b from-white to-slate-50 pt-6 pb-4 md:pt-10 md:pb-6"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-12">
          {/* ===== LEFT: Title column (sticky on desktop) ===== */}
          <div className="shrink-0 lg:w-[260px] xl:w-[300px]">
            <div className="lg:sticky lg:top-24">
              <h2 className="relative inline-block text-2xl font-extrabold uppercase leading-[1.05] tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                Latest
                <br className="hidden lg:block" />
                {" "}Adventures
              </h2>

              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-4 py-2 text-sm font-semibold text-emerald-700">
                <span aria-hidden>{"\u2665"}</span>
                143+ trips booked last week
              </div>
            </div>
          </div>

          {/* ===== RIGHT: filter bar + card rail ===== */}
          <div className="relative min-w-0 flex-1">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div className="no-scrollbar flex min-w-0 items-center gap-2 overflow-x-auto sm:gap-3">
                {/* Destinations dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setDestinationOpen((v) => !v)}
                    className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-medium text-slate-700 transition-all hover:border-cyan-400 hover:text-cyan-600"
                    aria-expanded={destinationOpen}
                  >
                    {destination === "All" ? "All Destinations" : destination}
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-300 ${
                        destinationOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {destinationOpen && (
                    <div className="absolute left-0 top-full z-20 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
                      <button
                        type="button"
                        onClick={() => {
                          setDestination("All");
                          setDestinationOpen(false);
                        }}
                        className={`block w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-slate-50 ${
                          destination === "All"
                            ? "font-semibold text-cyan-700"
                            : "text-slate-700"
                        }`}
                      >
                        All Destinations
                      </button>
                      {destinations.map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => {
                            setDestination(d);
                            setDestinationOpen(false);
                          }}
                          className={`block w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-slate-50 ${
                            destination === d
                              ? "font-semibold text-cyan-700"
                              : "text-slate-700"
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {PRICE_FILTERS.map((f) => {
                  const active = bucket === f;
                  const label =
                    f === "Luxury"
                      ? "Luxury"
                      : f === "Under 50K"
                      ? "Under \u20B950K"
                      : `\u20B9${f.replace(" to ", " to \u20B9")}`;
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setBucket(active ? "All" : f)}
                      className={`whitespace-nowrap rounded-full border px-5 py-2 text-sm font-medium transition-all ${
                        active
                          ? "border-indigo-300 bg-indigo-100 text-indigo-700 shadow-sm"
                          : "border-indigo-100 bg-indigo-50/70 text-indigo-700 hover:border-indigo-300"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  aria-label="Previous itinerary"
                  onClick={() => scrollByCard(-1)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-amber-200 bg-white text-slate-600 shadow-sm transition-all hover:border-amber-400 hover:text-amber-700 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  aria-label="Next itinerary"
                  onClick={() => scrollByCard(1)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-amber-200 bg-white text-slate-600 shadow-sm transition-all hover:border-amber-400 hover:text-amber-700 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div
              ref={railRef}
              className="no-scrollbar -mr-4 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-4 pr-4 sm:-mr-6 sm:pr-6 lg:-mr-8 lg:pr-8"
            >
              {visible.length === 0 ? (
                <div className="w-full rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
                  No itineraries match this filter right now.
                </div>
              ) : (
                visible.map((itin, i) => (
                  <ItineraryCard
                    key={itin.id}
                    itin={itin}
                    avatarColor={AVATAR_COLORS[i % AVATAR_COLORS.length]}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ItineraryCard({
  itin,
  avatarColor,
}: {
  itin: RecentItineraryCard;
  avatarColor: string;
}) {
  const planTripHref = `/plan-trip?destination=${encodeURIComponent(itin.destination)}&returnTo=${encodeURIComponent(itin.detailsUrl)}`;

  return (
    <article
      data-itin-card
      className="group relative flex w-[82vw] min-w-[280px] max-w-[360px] flex-shrink-0 snap-start flex-col overflow-hidden rounded-3xl bg-white shadow-lg shadow-slate-900/5 ring-1 ring-slate-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-900/10 sm:w-[48vw] sm:max-w-[380px] lg:w-[360px]"
    >
      <div className="flex items-center gap-3 bg-slate-900 px-4 py-3 text-white">
        <span
          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold uppercase ${avatarColor}`}
        >
          {itin.bookedBy.name[0]}
        </span>
        <p className="truncate text-xs sm:text-sm">
          <span className="font-semibold">{itin.bookedBy.name}</span>
          <span className="text-white/70"> from {itin.bookedBy.city}</span>
          <span className="text-white/40"> &bull; {itin.bookedBy.ago}</span>
        </p>
      </div>

      <div className="relative h-44 w-full flex-shrink-0 overflow-hidden bg-slate-100 sm:h-48">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={itin.image}
          alt={itin.title}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-base font-bold leading-snug text-slate-900 line-clamp-2 sm:text-lg">
          {itin.title}
        </h3>

        <p className="mt-3 flex items-center gap-1.5 text-sm text-slate-500">
          <MapPin className="h-4 w-4 flex-shrink-0 text-cyan-500" />
          <span className="truncate">
            {itin.primaryLocation}
            {itin.extraStops > 0 && (
              <span className="text-slate-400"> +{itin.extraStops} more</span>
            )}
          </span>
        </p>

        <span className="mt-3 inline-flex w-fit items-center rounded-full bg-rose-100/80 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-rose-600">
          {itin.audience}
        </span>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div className="min-w-0">
            <div className="truncate text-xl font-extrabold text-slate-900">
              {formatINR(itin.price)}
            </div>
            <div className="text-[11px] text-slate-500">
              {itin.nights} nights / person
            </div>
          </div>
          {itin.active ? (
            <Link
              href={planTripHref}
              className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-500/30 transition-all hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/40"
            >
              Unlock Details
            </Link>
          ) : (
            <span
              title="Itinerary coming soon"
              aria-disabled
              className="inline-flex flex-shrink-0 cursor-not-allowed items-center gap-1.5 rounded-xl bg-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-500"
            >
              Coming Soon
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
