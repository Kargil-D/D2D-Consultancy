"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, MapPin, Search, Sparkles } from "lucide-react";
import { INDIAN_CITIES, type City } from "@/data/cities";

interface DepartureCitySelectorProps {
  value: string | null;
  onChange: (city: string) => void;
}

/**
 * Premium searchable dropdown for Indian departure cities.
 * - Popular cities surface first
 * - Keyboard accessible (? ? Enter Esc)
 */
export default function DepartureCitySelector({
  value,
  onChange,
}: DepartureCitySelectorProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo<City[]>(() => {
    const q = query.trim().toLowerCase();
    const sorted = [...INDIAN_CITIES].sort((a, b) => {
      if (a.popular && !b.popular) return -1;
      if (!a.popular && b.popular) return 1;
      return a.name.localeCompare(b.name);
    });
    if (!q) return sorted;
    return sorted.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.state.toLowerCase().includes(q),
    );
  }, [query]);

  // Outside click closes dropdown
  useEffect(() => {
    const onMouse = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onMouse);
    return () => document.removeEventListener("mousedown", onMouse);
  }, []);

  // Reset highlight when filter changes
  useEffect(() => setActive(0), [query, open]);

  // Focus input when opened
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const select = (city: City) => {
    onChange(city.name);
    setOpen(false);
    setQuery("");
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const c = filtered[active];
      if (c) select(c);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-xl mx-auto">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl border-2 bg-white shadow-sm transition-all ${
          open
            ? "border-cyan-500 ring-4 ring-cyan-500/15"
            : "border-slate-200 hover:border-cyan-300"
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white">
          <MapPin className="w-5 h-5" />
        </span>
        <span className="flex-1 text-left">
          <span className="block text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Departure City
          </span>
          <span
            className={`block text-base font-semibold ${
              value ? "text-slate-900" : "text-slate-400"
            }`}
          >
            {value ?? "Select your city"}
          </span>
        </span>
        <ChevronDown
          className={`w-5 h-5 text-slate-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="absolute z-30 left-0 right-0 mt-2 rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden"
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKey}
                placeholder="Search Indian cities..."
                className="flex-1 bg-transparent outline-none text-sm text-slate-900 placeholder:text-slate-400"
              />
            </div>

            <div className="px-4 py-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              <Sparkles className="w-3 h-3 text-cyan-500" />
              {query ? "Matches" : "Popular cities"}
            </div>

            <ul
              role="listbox"
              className="max-h-72 overflow-y-auto py-1"
            >
              {filtered.length === 0 && (
                <li className="px-5 py-6 text-sm text-center text-slate-500">
                  No cities found.
                </li>
              )}
              {filtered.map((c, i) => {
                const selected = value === c.name;
                const highlighted = i === active;
                return (
                  <li key={c.name}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => select(c)}
                      className={`w-full flex items-center justify-between gap-3 px-5 py-2.5 text-left transition-colors ${
                        highlighted ? "bg-cyan-50" : ""
                      }`}
                    >
                      <span>
                        <span className="block text-sm font-semibold text-slate-900">
                          {c.name}
                          {c.popular && (
                            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold uppercase tracking-wider">
                              Popular
                            </span>
                          )}
                        </span>
                        <span className="block text-xs text-slate-500">
                          {c.state}
                        </span>
                      </span>
                      {selected && (
                        <Check className="w-4 h-4 text-cyan-600" strokeWidth={3} />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
