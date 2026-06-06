"use client";

import { motion } from "framer-motion";
import { Check, Languages } from "lucide-react";
import { LANGUAGE_OPTIONS } from "@/data/planner";

interface LanguageSelectorProps {
  value: string | null;
  onChange: (id: string) => void;
}

/**
 * Two-column language picker. Mirrors the reference card with a soft
 * yellow tint and a tagline reminding the customer that they'll be paired
 * with an expert who speaks their language.
 */
export default function LanguageSelector({
  value,
  onChange,
}: LanguageSelectorProps) {
  return (
    <div className="mx-auto max-w-2xl rounded-3xl bg-gradient-to-br from-amber-50/60 to-white border border-amber-100 shadow-sm p-5 sm:p-7">
      {/*<div className="flex items-start gap-3">*/}
      {/*  <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex-shrink-0">*/}
      {/*    <Languages className="w-4 h-4" />*/}
      {/*  </span>*/}
      {/*</div>*/}

      <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4">
        {LANGUAGE_OPTIONS.map((opt, i) => {
          const selected = value === opt.id;
          return (
            <motion.button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.03 }}
              whileTap={{ scale: 0.97 }}
              className={`relative px-4 py-3 rounded-2xl border-2 text-sm font-semibold transition-all ${
                selected
                  ? "border-cyan-500 bg-cyan-50 text-cyan-700 ring-4 ring-cyan-500/15 shadow-sm"
                  : "border-slate-200 bg-white text-slate-700 hover:border-cyan-300 hover:text-cyan-600"
              }`}
              aria-pressed={selected}
            >
              {opt.label}
              {selected && (
                <span className="absolute top-2 right-2 flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500 text-white">
                  <Check className="w-3 h-3" strokeWidth={3} />
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
