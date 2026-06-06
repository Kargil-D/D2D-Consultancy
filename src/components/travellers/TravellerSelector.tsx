"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { TRAVELLER_OPTIONS } from "@/data/planner";
import type { TravellerId } from "@/types";

interface TravellerSelectorProps {
  value: TravellerId | null;
  onChange: (id: TravellerId) => void;
}

export default function TravellerSelector({
  value,
  onChange,
}: TravellerSelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
      {TRAVELLER_OPTIONS.map((opt, i) => {
        const selected = value === opt.id;
        return (
          <motion.button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            whileHover={{ y: -6 }}
            whileTap={{ scale: 0.97 }}
            className={`relative text-left rounded-3xl overflow-hidden border-2 bg-white shadow-md transition-all duration-300 ${
              selected
                ? "border-cyan-500 ring-4 ring-cyan-500/20 shadow-xl shadow-cyan-500/20"
                : "border-transparent hover:shadow-xl"
            }`}
            aria-pressed={selected}
          >
            <div className="relative h-40 sm:h-44 w-full overflow-hidden">
              <Image
                src={opt.image}
                alt={opt.title}
                fill
                sizes="(max-width: 640px) 50vw, (max-width:1024px) 33vw, 20vw"
                className="object-cover transition-transform duration-700 hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/10 to-transparent" />

              {selected && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 18 }}
                  className="absolute top-3 right-3 flex items-center justify-center w-8 h-8 rounded-full bg-cyan-500 text-white shadow-lg"
                >
                  <Check className="w-4 h-4" strokeWidth={3} />
                </motion.span>
              )}
            </div>
            <div className="p-4">
              <div className="font-bold text-slate-900">{opt.title}</div>
              <div className="text-xs text-slate-500 mt-0.5">
                {opt.description}
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
