"use client";

import { useEffect, useRef, useState } from "react";
import { inputCls } from "@/components/admin/ui/Field";

interface UserOption {
  id: string;
  firstName: string;
  lastName: string;
}

interface Props {
  users: UserOption[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
}

const fullName = (u: UserOption) => `${u.firstName} ${u.lastName}`.trim();

/** Looks like a plain text box, but only ever commits a real User id — typing filters the list, picking an option is what actually calls onChange. */
export default function UserSearchSelect({ users, value, onChange, placeholder }: Props) {
  const [query, setQuery] = useState(() => {
    const current = users.find((u) => u.id === value);
    return current ? fullName(current) : "";
  });
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const current = users.find((u) => u.id === value);
    setQuery(current ? fullName(current) : "");
  }, [value, users]);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        const current = users.find((u) => u.id === value);
        setQuery(current ? fullName(current) : "");
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open, value, users]);

  const filtered = query.trim()
    ? users.filter((u) => fullName(u).toLowerCase().includes(query.trim().toLowerCase()))
    : users;

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
            filtered.map((u) => (
              <button
                key={u.id}
                type="button"
                className="block w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(u.id);
                  setQuery(fullName(u));
                  setOpen(false);
                }}
              >
                {fullName(u)}
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
