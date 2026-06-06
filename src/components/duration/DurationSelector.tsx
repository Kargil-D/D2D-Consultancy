"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Check } from "lucide-react";
import { DURATION_OPTIONS } from "@/data/planner";

interface DurationSelectorProps {
  value: string | null;
  onChange: (id: string) => void;
}

/** True when the value represents the "custom" choice (with or without days). */
export function isCustomDuration(value: string | null): boolean {
  return !!value && (value === "custom" || value.startsWith("custom-"));
}

/** Extract the days component from a custom duration value (or null). */
export function getCustomDays(value: string | null): number | null {
  if (!value || !value.startsWith("custom-")) return null;
  const n = Number(value.slice("custom-".length));
  return Number.isFinite(n) && n > 0 ? n : null;
}

export default function DurationSelector({
  value,
  onChange,
}: DurationSelectorProps) {
  const customSelected = isCustomDuration(value);
  const customDays = getCustomDays(value);

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {DURATION_OPTIONS.map((opt, i) => {
          const selected =
            opt.id === "custom" ? customSelected : value === opt.id;
          return (
            <motion.button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.04 }}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.96 }}
              className={`relative px-4 py-6 rounded-2xl border-2 bg-white text-left transition-all duration-300 ${
                selected
                  ? "border-cyan-500 bg-gradient-to-br from-cyan-50 to-teal-50 ring-4 ring-cyan-500/15 shadow-lg shadow-cyan-500/15"
                  : "border-slate-200 hover:border-cyan-300 hover:shadow-md"
              }`}
              aria-pressed={selected}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`flex items-center justify-center w-9 h-9 rounded-xl ${
                    selected
                      ? "bg-cyan-500 text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                </span>
                {selected && (
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500 text-white">
                    <Check className="w-3.5 h-3.5" strokeWidth={3} />
                  </span>
                )}
              </div>
              <div className="mt-4 text-lg font-bold text-slate-900">
                {opt.id === "custom" && customDays
                  ? `${customDays} Days`
                  : opt.label}
              </div>
              <div className="text-xs text-slate-500">{opt.hint}</div>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {customSelected && (
          <motion.div
            initial={{ opacity: 0, y: 12, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: 12, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-6 mx-auto max-w-md rounded-2xl bg-gradient-to-br from-white to-cyan-50/60 border border-cyan-100 shadow-md shadow-cyan-500/10 p-5 sm:p-6">
              <label
                htmlFor="custom-days"
                className="block text-xs font-bold uppercase tracking-widest text-cyan-600"
              >
                Preferred number of days
              </label>
              <div className="mt-3 flex items-center gap-3">
                <input
                  id="custom-days"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={60}
                  placeholder="e.g. 9"
                  value={customDays ?? ""}
                  onChange={(e) => {
                    const raw = e.target.value.trim();
                    if (!raw) {
                      onChange("custom");
                      return;
                    }
                    const n = Math.max(1, Math.min(60, Number(raw) || 0));
                    onChange(n ? `custom-${n}` : "custom");
                  }}
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-base font-semibold text-slate-900 focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/15 transition-all"
                />
                <span className="text-sm font-medium text-slate-500">days</span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Enter how many days you&apos;d like the trip to last (1 - 60).
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
