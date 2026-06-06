"use client";

import { forwardRef, useId } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: ReactNode;
  rightSlot?: ReactNode;
  hint?: string;
}

const InputField = forwardRef<HTMLInputElement, InputFieldProps>(function InputField(
  { label, error, icon, rightSlot, hint, className = "", id, ...rest },
  ref,
) {
  const reactId = useId();
  const fieldId = id ?? reactId;

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={fieldId}
        className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
      >
        {label}
      </label>
      <div
        className={`group relative flex items-center rounded-2xl border bg-white/80 backdrop-blur transition-all
          ${error ? "border-rose-300 ring-2 ring-rose-100" : "border-slate-200 focus-within:border-cyan-500 focus-within:ring-4 focus-within:ring-cyan-100"}`}
      >
        {icon && (
          <span className="pl-3.5 text-slate-400 group-focus-within:text-cyan-600 transition-colors">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          id={fieldId}
          aria-invalid={!!error}
          aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
          className={`flex-1 bg-transparent outline-none px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 ${className}`}
          {...rest}
        />
        {rightSlot && <span className="pr-2.5">{rightSlot}</span>}
      </div>
      {error ? (
        <p id={`${fieldId}-error`} className="text-xs text-rose-600 font-medium">
          {error}
        </p>
      ) : hint ? (
        <p id={`${fieldId}-hint`} className="text-xs text-slate-400">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

export default InputField;
