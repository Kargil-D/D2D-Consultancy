"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { inputCls } from "@/components/admin/ui/Field";
import { citiesApi } from "@/lib/adminApi";
import type { AdminCity } from "@/types/admin";

interface CityMultiSelectProps {
  value: AdminCity[];
  onChange: (next: AdminCity[]) => void;
  placeholder?: string;
  /** When provided, restricts the picker to this fixed list (client-side filtered, no server
   * search, no "Add" option) — e.g. only cities already mapped to a selected Destination, for
   * the Activity form. Omit to search + find-or-create across the full City master (Destination
   * form usage). */
  options?: AdminCity[];
  /** Empty-state copy shown in scoped mode when `options` has nothing left to pick. */
  emptyText?: string;
  /** Unscoped (server-search) mode only: restricts search + find-or-create to cities tagged
   * with this country, plus untagged legacy cities. Typically the Destination form's own
   * country field, so the picker doesn't surface cities that belong to other countries. */
  countryFilter?: string;
}

/** Searchable multi-select with removable chips, backed by the City master (many-to-many via
 * DestinationCity/ActivityCity). Typing searches existing cities server-side (debounced); if
 * nothing matches, an "Add" option find-or-creates the city so it's reusable elsewhere later.
 * Pass `options` to instead scope selection to a fixed, already-loaded list (no server search,
 * no add-new) — see the doc comment on that prop. */
export default function CityMultiSelect({
  value,
  onChange,
  placeholder = "Search or select city...",
  options: scopedOptions,
  emptyText = "No cities available",
  countryFilter,
}: CityMultiSelectProps) {
  const scoped = scopedOptions !== undefined;
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [serverOptions, setServerOptions] = useState<AdminCity[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scoped || !open) return;
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(async () => {
      const res = await citiesApi.list({ search: query.trim(), pageSize: 20, country: countryFilter });
      if (cancelled) return;
      setServerOptions(res.success ? res.data.items : []);
      setLoading(false);
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, open, scoped, countryFilter]);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const selectedIds = new Set(value.map((c) => c.id));
  const trimmedQuery = query.trim();
  const filteredOptions = (scoped ? scopedOptions! : serverOptions).filter(
    (c) => !selectedIds.has(c.id) && (!scoped || !trimmedQuery || c.name.toLowerCase().includes(trimmedQuery.toLowerCase())),
  );
  const hasExactMatch = filteredOptions.some((c) => c.name.toLowerCase() === trimmedQuery.toLowerCase());
  const canOfferNew = !scoped && !!trimmedQuery && !hasExactMatch;

  const addCity = (city: AdminCity) => {
    if (selectedIds.has(city.id)) return;
    onChange([...value, city]);
    setQuery("");
  };

  const removeCity = (id: string) => {
    onChange(value.filter((c) => c.id !== id));
  };

  const createAndAddCity = async () => {
    if (!trimmedQuery || adding) return;
    setAdding(true);
    try {
      const res = await citiesApi.create(trimmedQuery, countryFilter);
      if (res.success && res.data) addCity(res.data);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((c) => (
            <span
              key={c.id}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200"
            >
              {c.name}
              <button type="button" onClick={() => removeCity(c.id)} className="hover:text-blue-900" aria-label={`Remove ${c.name}`}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative" ref={containerRef}>
        <input
          type="text"
          className={inputCls}
          value={query}
          placeholder={placeholder}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (filteredOptions.length > 0) addCity(filteredOptions[0]);
              else if (canOfferNew) createAndAddCity();
            }
          }}
        />
        {open && (
          <div className="absolute z-10 mt-1 w-full max-h-56 overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
            {loading ? (
              <div className="px-3 py-2 text-sm text-slate-400">Searching…</div>
            ) : (
              <>
                {filteredOptions.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="block w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      addCity(c);
                    }}
                  >
                    {c.name}
                  </button>
                ))}
                {canOfferNew && (
                  <button
                    type="button"
                    disabled={adding}
                    className="flex items-center gap-1 w-full text-left px-3 py-2 text-sm text-blue-700 font-medium hover:bg-blue-50 disabled:opacity-50"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      createAndAddCity();
                    }}
                  >
                    <Plus className="w-3.5 h-3.5" /> Add &quot;{trimmedQuery}&quot;
                  </button>
                )}
                {filteredOptions.length === 0 && (scoped ? true : !trimmedQuery) && (
                  <div className="px-3 py-2 text-sm text-slate-400">{scoped ? emptyText : "Type to search or add a city"}</div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
