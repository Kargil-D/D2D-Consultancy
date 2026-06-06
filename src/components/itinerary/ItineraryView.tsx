"use client";

import { useState } from "react";
import { Calendar, Clock } from "lucide-react";

export interface ItineraryActivity {
  time: string;
  activity: string;
}

export interface ItineraryDay {
  label: string;
  title: string;
  activities: ItineraryActivity[];
}

interface ItineraryViewProps {
  days: ItineraryDay[];
  inclusions: string[];
  exclusions: string[];
}

export default function ItineraryView({
  days,
  inclusions,
  exclusions,
}: ItineraryViewProps) {
  const [active, setActive] = useState(0);
  const day = days[active];

  return (
    <div className="px-6 pb-8 sm:px-10 sm:pb-10">
      {/* Tabs */}
      <div className="mt-2 flex items-stretch border-b border-slate-200">
        {days.map((d, i) => {
          const isActive = i === active;
          return (
            <button
              key={d.label}
              type="button"
              onClick={() => setActive(i)}
              className={`flex-1 px-2 pb-3 pt-2 text-center text-base font-semibold transition-colors sm:text-lg ${
                isActive
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "border-b-2 border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {d.label}
            </button>
          );
        })}
      </div>

      {/* Day header card */}
      <div className="mt-6 flex items-center gap-4 rounded-xl bg-blue-50 p-5">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-white text-blue-600 ring-1 ring-blue-100">
          <Calendar className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-blue-700 sm:text-xl">
            {day.label}
          </h3>
          <p className="text-sm text-slate-600 sm:text-base">{day.title}</p>
        </div>
      </div>

      {/* Plan for the day */}
      <div className="mt-8">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full ring-2 ring-blue-500 text-blue-600">
            <Clock className="h-5 w-5" />
          </span>
          <h4 className="text-lg font-bold text-slate-900 sm:text-xl">
            Plan for the Day
          </h4>
        </div>

        <ol className="relative mt-5 ml-4 space-y-5 border-l-2 border-dashed border-slate-200 pl-6">
          {day.activities.map((a) => (
            <li key={`${a.time}-${a.activity}`} className="relative">
              <span className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full bg-blue-500 ring-4 ring-white" />
              <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
                <span className="w-20 shrink-0 text-sm font-semibold text-blue-600 sm:text-base">
                  {a.time}
                </span>
                <span className="text-sm text-slate-800 sm:text-base">
                  {a.activity}
                </span>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-8 border-t border-slate-200" />

      {/* Inclusions */}
      <div className="mt-6">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full ring-2 ring-emerald-500 text-emerald-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          <h4 className="text-lg font-bold text-emerald-600 sm:text-xl">
            Inclusions
          </h4>
        </div>
        <ul className="mt-3 space-y-2 pl-12">
          {inclusions.map((item) => (
            <li
              key={item}
              className="flex items-center gap-3 text-sm text-slate-800 sm:text-base"
            >
              <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8 border-t border-slate-200" />

      {/* Exclusions */}
      <div className="mt-6">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full ring-2 ring-rose-500 text-rose-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </span>
          <h4 className="text-lg font-bold text-rose-600 sm:text-xl">
            Exclusions
          </h4>
        </div>
        <ul className="mt-3 space-y-2 pl-12">
          {exclusions.map((item) => (
            <li
              key={item}
              className="flex items-center gap-3 text-sm text-slate-800 sm:text-base"
            >
              <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-rose-500" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
