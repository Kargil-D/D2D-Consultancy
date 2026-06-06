"use client";

import { motion } from "framer-motion";
import { Minus, Plus, Users } from "lucide-react";

interface FamilyTravellerSelectorProps {
  adults: number;
  kids: number;
  minAdults?: number;
  maxAdults?: number;
  maxKids?: number;
  onChange: (next: { adults: number; kids: number }) => void;
}

/**
 * Family-specific traveller picker.
 *
 * Layout (matches the supplied reference):
 *   ROOM 1
 *   --------------------------------------------------
 *   Adults                       [ - ]   2   [ + ]
 *   Children - 0 to 11 yrs       [ - ]   0   [ + ]
 *
 * Renders inside the same glass card style as the existing
 * {@link TravellerCountSelector} so the planner step keeps its visual
 * rhythm when the user toggles between Family and Friends.
 */
export default function FamilyTravellerSelector({
  adults,
  kids,
  minAdults = 1,
  maxAdults = 12,
  maxKids = 10,
  onChange,
}: FamilyTravellerSelectorProps) {
  const decAdults = () =>
    adults > minAdults && onChange({ adults: adults - 1, kids });
  const incAdults = () =>
    adults < maxAdults && onChange({ adults: adults + 1, kids });
  const decKids = () => kids > 0 && onChange({ adults, kids: kids - 1 });
  const incKids = () =>
    kids < maxKids && onChange({ adults, kids: kids + 1 });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, height: 0 }}
      animate={{ opacity: 1, y: 0, height: "auto" }}
      exit={{ opacity: 0, y: 12, height: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="overflow-hidden"
    >
      <div className="mt-8 mx-auto max-w-xl rounded-3xl bg-gradient-to-br from-white to-cyan-50/60 border border-cyan-100 shadow-lg shadow-cyan-500/10 overflow-hidden">
        {/* Room header */}
        <div className="bg-amber-50/70 px-5 py-3 sm:px-6 border-b border-amber-100">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-700" />
            <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-slate-800">
              Room 1
            </span>
          </div>
        </div>

        <div className="px-5 py-5 sm:px-7 sm:py-6 space-y-5">
          <CountRow
            label="Adults"
            value={adults}
            onDec={decAdults}
            onInc={incAdults}
            decDisabled={adults <= minAdults}
            incDisabled={adults >= maxAdults}
          />
          <CountRow
            label="Children"
            sublabel="0 to 11 yrs"
            value={kids}
            onDec={decKids}
            onInc={incKids}
            decDisabled={kids <= 0}
            incDisabled={kids >= maxKids}
          />
        </div>
      </div>
    </motion.div>
  );
}

interface CountRowProps {
  label: string;
  sublabel?: string;
  value: number;
  onDec: () => void;
  onInc: () => void;
  decDisabled?: boolean;
  incDisabled?: boolean;
}

function CountRow({
  label,
  sublabel,
  value,
  onDec,
  onInc,
  decDisabled,
  incDisabled,
}: CountRowProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <span className="text-base font-semibold text-slate-900">{label}</span>
        {sublabel && (
          <span className="ml-2 text-sm text-slate-400">- {sublabel}</span>
        )}
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={onDec}
          disabled={decDisabled}
          aria-label={`Decrease ${label.toLowerCase()}`}
          className="flex items-center justify-center w-10 h-10 rounded-xl border-2 border-slate-200 text-slate-600 hover:border-cyan-500 hover:text-cyan-600 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Minus className="w-4 h-4" strokeWidth={2.5} />
        </button>

        <motion.span
          key={value}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className="w-6 text-center text-lg font-bold text-slate-900 tabular-nums"
        >
          {value}
        </motion.span>

        <button
          type="button"
          onClick={onInc}
          disabled={incDisabled}
          aria-label={`Increase ${label.toLowerCase()}`}
          className="flex items-center justify-center w-10 h-10 rounded-xl border-2 border-slate-200 text-slate-600 hover:border-cyan-500 hover:text-cyan-600 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
