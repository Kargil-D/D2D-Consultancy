"use client";

import { useEffect, useRef, useState } from "react";
import { inputCls } from "@/components/admin/ui/Field";
import type { AdminDestination } from "@/types/admin";

interface Props {
  destinations: AdminDestination[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
}

/** Looks like a plain text box, but only ever commits a real Destination id — typing filters the
 * list, picking an option is what actually calls onChange. Mirrors UserSearchSelect's pattern. */
export default function DestinationSearchSelect({ destinations, value, onChange, placeholder = "Select destination" }: Props) {
  const [query, setQuery] = useState(() => destinations.find((d) => d.id === value)?.name ?? "");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(destinations.find((d) => d.id === value)?.name ?? "");
  }, [value, destinations]);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery(destinations.find((d) => d.id === value)?.name ?? "");
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open, value, destinations]);

  const filtered = query.trim()
    ? destinations.filter((d) => d.name.toLowerCase().includes(query.trim().toLowerCase()))
    : destinations;

  return (
    <div className="relative" ref={containerRef}>
      <input
        className={inputCls}
        value={query}
        placeholder={placeholder}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (e.target.value === "") onChange("");
        }}
        onFocus={() => setOpen(true)}
      />
      {open && (
        <div className="absolute z-10 mt-1 w-full max-h-56 overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          {filtered.length > 0 ? (
            filtered.map((d) => (
              <button
                key={d.id}
                type="button"
                className="block w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(d.id);
                  setQuery(d.name);
                  setOpen(false);
                }}
              >
                {d.name}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-slate-400">No matches</div>
          )}
        </div>
      )}
    </div>
  );
}
