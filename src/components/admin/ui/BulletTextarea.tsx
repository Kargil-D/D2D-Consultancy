"use client";

import type { KeyboardEvent } from "react";
import { textareaCls } from "./Field";

const BULLET = "• ";

interface BulletTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/** Textarea where pressing Enter starts a new bulleted line — for freeform note lists. */
export default function BulletTextarea({ value, onChange, placeholder, className = "" }: BulletTextareaProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const el = e.currentTarget;
    const { selectionStart, selectionEnd, value: current } = el;
    const insert = `\n${BULLET}`;
    const next = current.slice(0, selectionStart) + insert + current.slice(selectionEnd);
    onChange(next);
    requestAnimationFrame(() => {
      const pos = selectionStart + insert.length;
      el.setSelectionRange(pos, pos);
    });
  };

  return (
    <textarea
      className={`${textareaCls} ${className}`}
      value={value}
      placeholder={placeholder}
      onKeyDown={handleKeyDown}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
