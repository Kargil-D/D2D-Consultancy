"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bed, CheckCircle2, ChevronLeft, ChevronRight, Coffee, Dumbbell, Heart,
  ImageIcon, MapPin, Sparkles, Star, Tv, Utensils, Waves, Wifi, Wind,
  X, type LucideIcon,
} from "lucide-react";
import type { HotelOption } from "@/services/itineraryService";

const AMENITY_ICON_MAP: Record<string, LucideIcon> = {
  Waves, Wifi, Coffee, Utensils, Dumbbell, Heart, Sparkles, Tv, Wind, Bed,
  MapPin, Star,
};

const MEAL_PLAN_LABEL: Record<string, string> = {
  BB: "Bed & Breakfast",
  HB: "Half Board",
  FB: "Full Board",
  AI: "All Inclusive",
};

function guessAmenityIcon(label: string, explicit?: string): LucideIcon {
  if (explicit && AMENITY_ICON_MAP[explicit]) return AMENITY_ICON_MAP[explicit];
  const l = label.toLowerCase();
  if (l.includes("beach") || l.includes("pool") || l.includes("water")) return Waves;
  if (l.includes("wifi") || l.includes("internet")) return Wifi;
  if (l.includes("spa") || l.includes("massage")) return Heart;
  if (l.includes("gym") || l.includes("fitness")) return Dumbbell;
  if (l.includes("restaurant") || l.includes("dining") || l.includes("meal")) return Utensils;
  if (l.includes("breakfast") || l.includes("coffee") || l.includes("bar")) return Coffee;
  if (l.includes("kid") || l.includes("club")) return Sparkles;
  if (l.includes("ac") || l.includes("air")) return Wind;
  if (l.includes("tv")) return Tv;
  return Sparkles;
}

interface HotelCardProps {
  hotel: HotelOption;
}

export default function HotelCard({ hotel }: HotelCardProps) {
  const gallery = [hotel.image, ...(hotel.images ?? [])].filter(Boolean) as string[];
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const next = () => setActive((i) => (i + 1) % gallery.length);
  const prev = () => setActive((i) => (i - 1 + gallery.length) % gallery.length);

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-md shadow-slate-900/5">
      {hotel.tagline && (
        <div className="flex items-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-700 text-xs font-semibold border-b border-emerald-100">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {hotel.tagline}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr_1.1fr]">
        {/* Main gallery */}
        <div className="relative aspect-[4/3] lg:aspect-auto lg:min-h-[280px] bg-slate-100 group">
          {gallery.length > 0 ? (
            <>
              <Image
                src={gallery[active]}
                alt={hotel.name}
                fill
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover"
              />
              {gallery.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prev}
                    aria-label="Previous photo"
                    className="absolute left-3 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/85 backdrop-blur text-slate-700 shadow-md hover:bg-white transition"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={next}
                    aria-label="Next photo"
                    className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/85 backdrop-blur text-slate-700 shadow-md hover:bg-white transition"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setLightbox(true)}
                className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur text-xs font-semibold text-slate-800 shadow-md hover:bg-white"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                View All Photos
              </button>
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-slate-400">
              <ImageIcon className="w-8 h-8" />
            </div>
          )}
        </div>

        {/* Thumbnail stack */}
        <div className="hidden lg:flex flex-col gap-1.5 p-1.5">
          {gallery.slice(1, 3).map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => setActive(i + 1)}
              className="relative flex-1 min-h-[100px] overflow-hidden rounded-2xl bg-slate-100 group"
            >
              <Image
                src={src}
                alt={`${hotel.name} photo ${i + 2}`}
                fill
                sizes="20vw"
                className="object-cover transition-transform group-hover:scale-105"
              />
            </button>
          ))}
          {gallery.length <= 1 && (
            <div className="flex-1 rounded-2xl bg-slate-50" />
          )}
        </div>

        {/* Info */}
        <div className="p-5 lg:p-6 flex flex-col gap-3">
          <div>
            <h4 className="text-lg font-bold text-slate-900 leading-tight">{hotel.name}</h4>
            {hotel.starRating != null && (
              <div className="mt-1 flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < Math.round(hotel.starRating!)
                        ? "fill-amber-400 text-amber-400"
                        : "text-slate-200"
                    }`}
                  />
                ))}
              </div>
            )}
            {(hotel.area || hotel.city) && (
              <div className="mt-1.5 flex items-center gap-1 text-sm text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                {[hotel.area, hotel.city].filter(Boolean).join(", ")}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {hotel.category && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100">
                {hotel.category}
              </span>
            )}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
              {hotel.nights}N
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-100">
              {MEAL_PLAN_LABEL[hotel.mealPlan]}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-700">
            <Bed className="w-4 h-4 text-blue-600" />
            <span className="font-medium">{hotel.roomType}</span>
          </div>

          {hotel.amenities && hotel.amenities.length > 0 && (
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-slate-600">
              {hotel.amenities.slice(0, 6).map((a) => {
                const Icon = guessAmenityIcon(a.label, a.icon);
                return (
                  <div key={a.label} className="flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5 text-blue-600" />
                    <span className="truncate">{a.label}</span>
                  </div>
                );
              })}
            </div>
          )}

          {hotel.mapUrl && (
            <a
              href={hotel.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              View on Map
              <MapPin className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setLightbox(false)}
          >
            <button
              type="button"
              onClick={() => setLightbox(false)}
              aria-label="Close gallery"
              className="absolute top-4 right-4 inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div
              className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-5xl w-full max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {gallery.map((src, i) => (
                <div key={src + i} className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-800">
                  <Image src={src} alt={`${hotel.name} ${i + 1}`} fill sizes="33vw" className="object-cover" />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
