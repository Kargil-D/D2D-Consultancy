"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Clock } from "lucide-react";
import type { ItineraryDay } from "@/services/itineraryService";

interface ItineraryAccordionProps {
  days: ItineraryDay[];
}

/**
 * Day-wise itinerary accordion. First day is open by default; click any
 * other day header to expand it (others collapse automatically).
 */
export default function ItineraryAccordion({ days }: ItineraryAccordionProps) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="space-y-3">
      {days.map((day, i) => {
        const isOpen = i === openIndex;
        return (
          <div
            key={day.label}
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
                    isOpen
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {day.label.replace("Day ", "Day ")}
                </span>
                <span
                  className={`font-semibold text-base sm:text-lg truncate ${
                    isOpen ? "text-blue-700" : "text-slate-900"
                  }`}
                >
                  {day.title}
                </span>
              </div>
              <ChevronDown
                className={`w-5 h-5 flex-shrink-0 transition-transform ${
                  isOpen ? "rotate-180 text-blue-600" : "text-slate-400"
                }`}
              />
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
                    <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-blue-700">
                      <Clock className="w-4 h-4" />
                      Plan for the Day
                    </div>
                    <ol className="relative ml-3 space-y-4 border-l-2 border-dashed border-slate-200 pl-6">
                      {day.activities.map((a) => (
                        <li
                          key={`${a.time}-${a.activity}`}
                          className="relative"
                        >
                          <span className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full bg-blue-500 ring-4 ring-white" />
                          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                            <span className="w-24 shrink-0 text-sm font-semibold text-blue-600">
                              {a.time}
                            </span>
                            <span className="text-sm text-slate-700 flex-1">
                              {a.activity}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ol>
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
