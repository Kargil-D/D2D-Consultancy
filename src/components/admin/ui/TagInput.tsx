"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { inputCls } from "./Field";

interface TagInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}

export default function TagInput({
  value,
  onChange,
  placeholder = "Add and press Enter",
}: TagInputProps) {
  const [text, setText] = useState("");

  const add = () => {
    const t = text.trim();
    if (!t) return;
    if (value.includes(t)) return setText("");
    onChange([...value, t]);
    setText("");
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className={inputCls}
        />
        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold"
        >
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200"
            >
              {t}
              <button
                type="button"
                onClick={() => onChange(value.filter((v) => v !== t))}
                className="hover:text-blue-900"
                aria-label={`Remove ${t}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
