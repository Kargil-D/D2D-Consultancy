"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, ArrowRight, Sparkles, X } from "lucide-react";
import { POPULAR_DESTINATIONS, type Destination } from "@/data/destinations";

interface DestinationSearchProps {
  /** Optional Tailwind override for layout positioning */
  className?: string;
}

/**
 * Premium glassmorphism destination search bar with autocomplete.
 *
 * Performance / UX fixes:
 *  - Prefetch /plan-trip on focus so the first click is instant.
 *  - Single-click guarantee: handler runs on `pointerdown` (fires before
 *    blur) so no race with the outside-click listener.
 *  - Whole-bar loading state shown immediately for visual feedback.
 *  - Hard navigation via window.location.href (instant, never gets
 *    swallowed by RSC prefetch queue in dev).
 */
export default function DestinationSearch({
  className = "",
}: DestinationSearchProps) {
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [navigating, setNavigating] = useState(false);

  // Filter destinations based on query
  const filtered = useMemo<Destination[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return POPULAR_DESTINATIONS;
    return POPULAR_DESTINATIONS.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.country.toLowerCase().includes(q),
    );
  }, [query]);

  // Outside-click closes the dropdown only if the click is outside both
  // the search wrapper AND the dropdown (which is fixed-positioned on mobile
  // and therefore not a DOM child of the wrapper).
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(target) &&
        (!dropdownRef.current || !dropdownRef.current.contains(target))
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  // Prefetch the planner route as soon as the user shows intent.
  const onFocusOpen = useCallback(() => {
    setOpen(true);
    router.prefetch("/plan-trip");
  }, [router]);

  /** Single-click navigation. Locks UI immediately and hard-navigates. */
  const goTo = useCallback(
    (destination: string) => {
      if (navigating) return;
      const target = destination.trim();
      if (!target) return;
      setNavigating(true);
      setOpen(false);
      // Hard navigation = guaranteed and feels instant (browser shows its
      // own loading indicator). Avoids RSC prefetch queue stalls in dev.
      window.location.href = `/plan-trip?destination=${encodeURIComponent(target)}`;
    },
    [navigating],
  );

  const submitFirst = () => {
    const target = filtered[0]?.name ?? query.trim();
    if (target) goTo(target);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
    if (e.key === "Enter") {
      e.preventDefault();
      submitFirst();
    }
  };

  return (
    <div
      ref={wrapperRef}
      // overflow-visible + z-[60] keeps the dropdown floating above sibling sections.
      className={`relative w-full max-w-3xl mx-auto overflow-visible z-[60] ${className}`}
    >
      {/* Glow ring */}
      <div
        aria-hidden
        className="absolute -inset-1 rounded-full bg-gradient-to-r from-cyan-400/40 via-teal-400/40 to-emerald-400/40 blur-xl opacity-70 pointer-events-none"
      />

      {/* Search bar */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="relative flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-full bg-white/15 backdrop-blur-xl border border-white/30 shadow-2xl shadow-slate-950/30"
      >
        <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 text-white flex-shrink-0">
          {navigating ? (
            <span className="w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Search className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          disabled={navigating}
          onFocus={onFocusOpen}
          onClick={onFocusOpen}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
          placeholder="Search your destinations"
          aria-label="Search travel destinations"
          autoComplete="off"
          className="flex-1 min-w-0 bg-transparent outline-none text-white placeholder:text-white/70 text-sm sm:text-base font-medium disabled:opacity-60"
        />

        {query && !navigating && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="p-2 rounded-full hover:bg-white/20 text-white/80"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <button
          type="button"
          disabled={navigating}
          onClick={submitFirst}
          className="hidden sm:inline-flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm font-semibold shadow-lg shadow-cyan-500/40 hover:shadow-cyan-500/60 transition-all disabled:opacity-60 disabled:cursor-wait"
        >
          {navigating ? "Loading..." : "Plan Trip"}
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          type="button"
          disabled={navigating}
          onClick={submitFirst}
          className="sm:hidden inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/40 disabled:opacity-60"
          aria-label="Plan trip"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>

      {/* Dropdown â€” bottom sheet on mobile, floating on desktop */}
      <AnimatePresence>
        {open && !navigating && (
          <>
          {/* Mobile backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[99] bg-black/40 sm:hidden"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-0 bottom-0 sm:absolute sm:inset-x-auto sm:bottom-auto sm:top-full sm:left-0 sm:right-0 mt-0 sm:mt-3 z-[100] rounded-t-3xl sm:rounded-3xl bg-white/[0.98] sm:bg-white/95 backdrop-blur-xl border border-white/60 shadow-2xl shadow-slate-950/30 overflow-hidden max-h-[70vh] sm:max-h-none overflow-y-auto touch-auto"
            role="listbox"
          >
            {/* Mobile drag handle */}
            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <span className="w-10 h-1 rounded-full bg-slate-300" />
            </div>
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xl px-5 py-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-500 border-b border-slate-100">
              <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
              {query ? "Matching destinations" : "Popular destinations"}
            </div>

            <ul className="max-h-[55vh] sm:max-h-[420px] overflow-y-auto overscroll-contain py-2 [scrollbar-width:thin] [scrollbar-color:#06b6d4_transparent]">
              {filtered.length === 0 && (
                <li className="px-5 py-8 text-center text-sm text-slate-500">
                  No destinations found. Try Maldives, Bali, or Dubai.
                </li>
              )}

              {filtered.map((d) => (
                <li key={d.name}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      // Desktop: fire before blur so outside-click can't race
                      e.preventDefault();
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      goTo(d.name);
                    }}
                    className="w-full flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-cyan-50 active:bg-cyan-100 focus:bg-cyan-50 outline-none text-left transition-colors group"
                  >
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 ring-1 ring-slate-200 group-hover:ring-cyan-300 transition">
                      <Image
                        src={d.image}
                        alt={d.name}
                        fill
                        sizes="48px"
                        className="object-cover pointer-events-none"
                      />
                    </div>
                    <div className="flex-1 min-w-0 pointer-events-none">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 truncate">
                          {d.name}
                        </span>
                        {d.tag && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700 font-semibold uppercase tracking-wider">
                            {d.tag}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        {d.country}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-600 group-hover:translate-x-1 transition-all pointer-events-none" />
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
