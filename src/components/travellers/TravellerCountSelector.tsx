"use client";

import { motion } from "framer-motion";
import { Minus, Plus, Users } from "lucide-react";

interface TravellerCountSelectorProps {
  value: number;
  min: number;
  max: number;
  label?: string;
  hint?: string;
  onChange: (next: number) => void;
}

/**
 * Premium +/- traveller count picker.
 * - Glassmorphism card
 * - Min/max enforced (and visually disabled at the limits)
 * - Animated number flip on change
 */
export default function TravellerCountSelector({
  value,
  min,
  max,
  label = "How many travellers are joining the trip?",
  hint,
  onChange,
}: TravellerCountSelectorProps) {
  const dec = () => value > min && onChange(value - 1);
  const inc = () => value < max && onChange(value + 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, height: 0 }}
      animate={{ opacity: 1, y: 0, height: "auto" }}
      exit={{ opacity: 0, y: 12, height: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="overflow-hidden"
    >
      <div className="mt-8 mx-auto max-w-xl rounded-3xl bg-gradient-to-br from-white to-cyan-50/60 border border-cyan-100 shadow-lg shadow-cyan-500/10 p-6 sm:p-8">
        <div className="flex items-center justify-center gap-2 text-cyan-600">
          <Users className="w-4 h-4" />
          <span className="text-[10px] font-semibold uppercase tracking-widest">
            Group size
          </span>
        </div>
        <h3 className="mt-2 text-center text-base sm:text-lg font-semibold text-slate-900">
          {label}
        </h3>

        <div className="mt-6 flex items-center justify-center gap-6 sm:gap-8">
          <button
            type="button"
            onClick={dec}
            disabled={value <= min}
            aria-label="Decrease travellers"
            className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white border-2 border-slate-200 text-slate-700 hover:border-cyan-500 hover:text-cyan-600 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
          >
            <Minus className="w-5 h-5" strokeWidth={2.5} />
          </button>

          <div className="relative w-24 sm:w-28 text-center">
            <motion.div
              key={value}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="text-5xl sm:text-6xl font-extrabold bg-gradient-to-br from-cyan-600 to-teal-600 bg-clip-text text-transparent leading-none"
            >
              {value}
            </motion.div>
            <div className="mt-1 text-xs font-medium text-slate-500">
              {value === 1 ? "traveller" : "travellers"}
            </div>
          </div>

          <button
            type="button"
            onClick={inc}
            disabled={value >= max}
            aria-label="Increase travellers"
            className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 text-white hover:shadow-lg hover:shadow-cyan-500/40 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-cyan-500/30"
          >
            <Plus className="w-5 h-5" strokeWidth={2.5} />
          </button>
        </div>

        <div className="mt-5 text-center text-xs text-slate-500">
          {hint ?? `Minimum ${min} ï¿½ Maximum ${max} travellers`}
        </div>
      </div>
    </motion.div>
  );
}
