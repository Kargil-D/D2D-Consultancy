"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

interface DepartureDatePickerProps {
  /** Selected date in ISO yyyy-mm-dd */
  value: string | null;
  onChange: (iso: string) => void;
}

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const toIso = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const formatLong = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

/**
 * Custom mobile-friendly calendar picker with future-only dates.
 */
export default function DepartureDatePicker({
  value,
  onChange,
}: DepartureDatePickerProps) {
  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => {
    const base = value ? new Date(value) : today;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Build day grid for current view
  const cells = useMemo(() => {
    const firstDow = new Date(view.getFullYear(), view.getMonth(), 1).getDay();
    const daysInMonth = new Date(
      view.getFullYear(),
      view.getMonth() + 1,
      0,
    ).getDate();

    const arr: (Date | null)[] = [];
    for (let i = 0; i < firstDow; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      arr.push(new Date(view.getFullYear(), view.getMonth(), d));
    }
    return arr;
  }, [view]);

  const goPrev = () => {
    const candidate = new Date(view.getFullYear(), view.getMonth() - 1, 1);
    const minMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    if (candidate >= minMonth) setView(candidate);
  };
  const goNext = () =>
    setView(new Date(view.getFullYear(), view.getMonth() + 1, 1));

  const canGoPrev =
    view.getFullYear() > today.getFullYear() ||
    (view.getFullYear() === today.getFullYear() &&
      view.getMonth() > today.getMonth());

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
      >
        <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white">
          <CalendarDays className="w-5 h-5" />
        </span>
        <span className="flex-1 text-left">
          <span className="block text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Departure Date
          </span>
          <span
            className={`block text-base font-semibold ${
              value ? "text-slate-900" : "text-slate-400"
            }`}
          >
            {value ? formatLong(value) : "Pick your travel date"}
          </span>
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="absolute z-30 left-0 right-0 mt-2 p-5 rounded-3xl bg-white border border-slate-200 shadow-2xl"
          >
            {/* Month header */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={goPrev}
                disabled={!canGoPrev}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="font-bold text-slate-900">
                {MONTHS[view.getMonth()]} {view.getFullYear()}
              </div>
              <button
                type="button"
                onClick={goNext}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-700"
                aria-label="Next month"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Weekday header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS.map((d, i) => (
                <div
                  key={i}
                  className="text-center text-[11px] font-semibold uppercase tracking-widest text-slate-400 py-1"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 gap-1">
              {cells.map((cell, idx) => {
                if (!cell)
                  return <div key={`e-${idx}`} className="h-10" />;
                const iso = toIso(cell);
                const disabled = cell < today;
                const selected = value === iso;
                const isToday = toIso(today) === iso;

                return (
                  <button
                    key={iso}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      onChange(iso);
                      setOpen(false);
                    }}
                    className={`h-10 rounded-xl text-sm font-medium transition-all ${
                      selected
                        ? "bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-md shadow-cyan-500/40"
                        : disabled
                        ? "text-slate-300 cursor-not-allowed"
                        : "text-slate-700 hover:bg-cyan-50 hover:text-cyan-700"
                    } ${
                      isToday && !selected
                        ? "ring-1 ring-cyan-400 text-cyan-600"
                        : ""
                    }`}
                  >
                    {cell.getDate()}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
              Future dates only Ã‚Â· Tap a date to confirm
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
