"use client";

import type { Status } from "@/types/admin";

interface StatusToggleProps {
  value: Status;
  onChange: (next: Status) => void;
  size?: "sm" | "md";
}

export default function StatusToggle({
  value,
  onChange,
  size = "md",
}: StatusToggleProps) {
  const active = value === "Active";
  const dims = size === "sm" ? "w-9 h-5" : "w-11 h-6";
  const knob =
    size === "sm"
      ? `w-4 h-4 ${active ? "translate-x-4" : "translate-x-0.5"}`
      : `w-5 h-5 ${active ? "translate-x-5" : "translate-x-0.5"}`;

  return (
    <button
      type="button"
      onClick={() => onChange(active ? "Inactive" : "Active")}
      className={`relative inline-flex items-center ${dims} rounded-full transition-colors ${
        active ? "bg-emerald-500" : "bg-slate-300"
      }`}
      aria-pressed={active}
    >
      <span
        className={`inline-block ${knob} rounded-full bg-white shadow transform transition-transform`}
      />
    </button>
  );
}

export function StatusBadge({ status }: { status: Status }) {
  const active = status === "Active";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
        active
          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
          : "bg-slate-100 text-slate-600 border border-slate-200"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          active ? "bg-emerald-500" : "bg-slate-400"
        }`}
      />
      {status}
    </span>
  );
}
