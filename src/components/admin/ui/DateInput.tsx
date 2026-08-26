"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";

interface DateInputProps {
  /** Selected date in ISO yyyy-mm-dd, or "" / null / undefined when empty. */
  value?: string | null;
  /** Called with an ISO yyyy-mm-dd date, or "" when cleared. */
  onChange: (iso: string) => void;
  /** Minimum selectable date, ISO yyyy-mm-dd. */
  min?: string;
  /** Maximum selectable date, ISO yyyy-mm-dd. */
  max?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

function parseIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Formats an ISO yyyy-mm-dd date as dd/MMM/yyyy, e.g. "26/Aug/2026". */
export function formatDdMmmYyyy(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return "";
  return `${String(d).padStart(2, "0")}/${MONTHS_SHORT[m - 1]}/${y}`;
}

/**
 * Reusable date picker used by every date field in the admin panel. Displays
 * dd/MMM/yyyy while keeping an ISO yyyy-mm-dd value/onChange contract so it
 * drops in wherever an `<input type="date">` used to be.
 */
export default function DateInput({
  value,
  onChange,
  min,
  max,
  disabled,
  placeholder = "Select date",
  className = "",
}: DateInputProps) {
  const [open, setOpen] = useState(false);
  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);
  const minDate = min ? parseIso(min) : null;
  const maxDate = max ? parseIso(max) : null;

  const [view, setView] = useState(() => {
    const base = value ? parseIso(value) : minDate ?? today;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const base = value ? parseIso(value) : minDate ?? today;
    setView(new Date(base.getFullYear(), base.getMonth(), 1));
    // Only re-derive the visible month at the moment the dropdown opens —
    // not on every value/min change while it stays open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    const onMouse = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onMouse);
    return () => document.removeEventListener("mousedown", onMouse);
  }, []);

  const cells = useMemo(() => {
    const firstDow = new Date(view.getFullYear(), view.getMonth(), 1).getDay();
    const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    const arr: (Date | null)[] = [];
    for (let i = 0; i < firstDow; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(new Date(view.getFullYear(), view.getMonth(), d));
    return arr;
  }, [view]);

  const minMonth = minDate ? new Date(minDate.getFullYear(), minDate.getMonth(), 1) : null;
  const maxMonth = maxDate ? new Date(maxDate.getFullYear(), maxDate.getMonth(), 1) : null;
  const canGoPrev = !minMonth || view > minMonth;
  const canGoNext = !maxMonth || view < maxMonth;

  const goPrev = () => {
    const candidate = new Date(view.getFullYear(), view.getMonth() - 1, 1);
    if (!minMonth || candidate >= minMonth) setView(candidate);
  };
  const goNext = () => {
    const candidate = new Date(view.getFullYear(), view.getMonth() + 1, 1);
    if (!maxMonth || candidate <= maxMonth) setView(candidate);
  };

  return (
    <div ref={containerRef} className="relative">
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => !disabled && setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((v) => !v);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        className={`flex items-center justify-between gap-2 w-full px-3 py-2 rounded-lg border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          disabled
            ? "bg-slate-50 text-slate-400 cursor-not-allowed border-slate-200"
            : "cursor-pointer border-slate-300"
        } ${open ? "ring-2 ring-blue-500 border-blue-500" : ""} ${className}`}
      >
        <span className={value ? "text-slate-900" : "text-slate-400"}>
          {value ? formatDdMmmYyyy(value) : placeholder}
        </span>
        <span className="flex items-center gap-1 shrink-0">
          {value && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              className="p-0.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              aria-label="Clear date"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <CalendarDays className="w-4 h-4 text-slate-400 pointer-events-none" />
        </span>
      </div>

      {open && !disabled && (
        <div className="absolute z-30 left-0 mt-1 p-3 w-64 rounded-xl bg-white border border-slate-200 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={goPrev}
              disabled={!canGoPrev}
              className="p-1 rounded-full hover:bg-slate-100 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-sm font-bold text-slate-900">
              {MONTHS[view.getMonth()]} {view.getFullYear()}
            </div>
            <button
              type="button"
              onClick={goNext}
              disabled={!canGoNext}
              className="p-1 rounded-full hover:bg-slate-100 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAYS.map((d, i) => (
              <div key={i} className="text-center text-[10px] font-semibold uppercase tracking-widest text-slate-400 py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((cell, idx) => {
              if (!cell) return <div key={`e-${idx}`} className="h-8" />;
              const iso = toIso(cell);
              const isDisabled = !!((minDate && cell < minDate) || (maxDate && cell > maxDate));
              const selected = value === iso;
              const isToday = toIso(today) === iso;

              return (
                <button
                  key={iso}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => {
                    onChange(iso);
                    setOpen(false);
                  }}
                  className={`h-8 rounded-lg text-xs font-medium transition-colors ${
                    selected
                      ? "bg-blue-600 text-white"
                      : isDisabled
                      ? "text-slate-300 cursor-not-allowed"
                      : "text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                  } ${isToday && !selected ? "ring-1 ring-blue-400 text-blue-600" : ""}`}
                >
                  {cell.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
