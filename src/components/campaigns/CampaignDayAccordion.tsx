"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import type { ItineraryDayDetail } from "@/types/admin";

interface CampaignDayAccordionProps {
  days: ItineraryDayDetail[];
}

/**
 * Day-wise itinerary accordion for the DB-backed campaign detail page.
 * First day is open by default; click any other day header to expand it
 * (others collapse automatically). Mirrors the visual style of
 * `ItineraryAccordion` used on the markdown-based `/itinerary/[id]` page.
 */
export default function CampaignDayAccordion({ days }: CampaignDayAccordionProps) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="space-y-3">
      {days.map((day, i) => {
        const isOpen = i === openIndex;
        const hasTags = day.activities?.length > 0 || day.mealsIncluded?.length > 0 || !!day.stayDetails || !!day.transportDetails;
        return (
          <div
            key={day.id}
            className={`overflow-hidden rounded-2xl border bg-white transition-shadow ${
              isOpen ? "border-blue-200 shadow-md shadow-blue-100" : "border-slate-200"
            }`}
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? -1 : i)}
              className={`w-full flex items-center justify-between gap-4 px-5 py-4 text-left transition-colors ${
                isOpen ? "bg-blue-50" : "hover:bg-slate-50"
              }`}
              aria-expanded={isOpen}
            >
              <div className="flex items-center gap-4 min-w-0">
                <span
                  className={`inline-flex items-center justify-center w-12 h-12 rounded-xl font-bold text-sm flex-shrink-0 ${
                    isOpen ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"
                  }`}
                >
                  Day {day.dayNumber}
                </span>
                <span className={`font-semibold text-base sm:text-lg truncate ${isOpen ? "text-blue-700" : "text-slate-900"}`}>
                  {day.title}
                </span>
              </div>
              <ChevronDown className={`w-5 h-5 flex-shrink-0 transition-transform ${isOpen ? "rotate-180 text-blue-600" : "text-slate-400"}`} />
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 pt-2 border-t border-blue-100/60 bg-white">
                    {day.description && <p className="text-sm text-slate-700">{day.description}</p>}
                    {hasTags && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {day.activities?.map((a) => (
                          <span key={a} className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">{a}</span>
                        ))}
                        {day.mealsIncluded?.map((m) => (
                          <span key={m} className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">{m}</span>
                        ))}
                        {day.stayDetails && (
                          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">{day.stayDetails}</span>
                        )}
                        {day.transportDetails && (
                          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">{day.transportDetails}</span>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
