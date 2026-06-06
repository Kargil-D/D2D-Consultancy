"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface StepDefinition {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface StepperTabsProps {
  steps: StepDefinition[];
  current: number;
  /** Allow jumping back to a completed/current step */
  onStepClick?: (index: number) => void;
  /** Steps the user has completed (used for the green checkmark + click) */
  completed: boolean[];
}

/**
 * Horizontal stepper showing progress through the planner.
 * Mobile-first: scrolls horizontally on small screens.
 */
export default function StepperTabs({
  steps,
  current,
  onStepClick,
  completed,
}: StepperTabsProps) {
  return (
    <div className="relative">
      <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
        {steps.map((step, idx) => {
          const isActive = idx === current;
          const isDone = completed[idx];
          const Icon = step.icon;
          const reachable = isDone || idx <= current;

          return (
            <div
              key={step.id}
              className="flex items-center flex-1 min-w-[110px]"
            >
              <button
                type="button"
                disabled={!reachable}
                onClick={() => reachable && onStepClick?.(idx)}
                className="flex items-center gap-3 group"
              >
                <motion.span
                  whileHover={reachable ? { scale: 1.05 } : undefined}
                  className={`relative flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 transition-all duration-300 ${
                    isActive
                      ? "bg-gradient-to-br from-cyan-500 to-teal-500 border-transparent shadow-lg shadow-cyan-500/40 text-white"
                      : isDone
                      ? "bg-emerald-500 border-transparent text-white"
                      : "bg-white border-slate-200 text-slate-400"
                  }`}
                >
                  {isDone && !isActive ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                  {isActive && (
                    <motion.span
                      layoutId="step-ring"
                      className="absolute inset-0 rounded-full ring-4 ring-cyan-400/30"
                    />
                  )}
                </motion.span>
                <span className="hidden sm:flex flex-col text-left">
                  <span className="text-[10px] font-semibold tracking-widest uppercase text-slate-400">
                    Step {idx + 1}
                  </span>
                  <span
                    className={`text-sm font-semibold ${
                      isActive
                        ? "text-slate-900"
                        : isDone
                        ? "text-slate-700"
                        : "text-slate-400"
                    }`}
                  >
                    {step.label}
                  </span>
                </span>
              </button>

              {idx < steps.length - 1 && (
                <div className="flex-1 mx-2 sm:mx-4 h-0.5 rounded-full bg-slate-200 overflow-hidden">
                  <motion.div
                    initial={false}
                    animate={{ width: isDone ? "100%" : "0%" }}
                    transition={{ duration: 0.5 }}
                    className="h-full bg-gradient-to-r from-cyan-500 to-teal-500"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
