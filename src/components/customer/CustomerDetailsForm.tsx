"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, User } from "lucide-react";
import { isValidEmail, isValidPhone } from "@/utils/validators";

interface CustomerDetailsFormProps {
  name: string;
  email: string;
  phone: string;
  onChange: (patch: { name?: string; email?: string; phone?: string }) => void;
}

/**
 * Final-step contact form. The parent planner page still gates the Submit button on the same
 * validity rules (see `contactOk` in plan-trip/page.tsx) — the touched-based errors here are
 * purely to explain *why* it's disabled, not a second source of truth.
 */
export default function CustomerDetailsForm({
  name,
  email,
  phone,
  onChange,
}: CustomerDetailsFormProps) {
  const [touched, setTouched] = useState({ name: false, email: false, phone: false });
  const touch = (field: keyof typeof touched) => setTouched((t) => ({ ...t, [field]: true }));

  const nameError = touched.name && name.trim().length <= 1 ? "Enter your full name." : undefined;
  const emailError = touched.email && !isValidEmail(email) ? "Enter a valid email address." : undefined;
  const phoneError = touched.phone && !isValidPhone(phone) ? "Enter a valid phone number." : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="max-w-xl mx-auto space-y-4"
    >
      <Field
        icon={User}
        label="Full Name"
        placeholder="e.g. Priya Sharma"
        value={name}
        onChange={(v) => onChange({ name: v })}
        onBlur={() => touch("name")}
        error={nameError}
        autoComplete="name"
      />
      <Field
        icon={Mail}
        label="Email"
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(v) => onChange({ email: v })}
        onBlur={() => touch("email")}
        error={emailError}
        autoComplete="email"
      />
      <Field
        icon={Phone}
        label="Phone Number"
        type="tel"
        placeholder="+91 98765 43210"
        value={phone}
        onChange={(v) => onChange({ phone: v })}
        onBlur={() => touch("phone")}
        error={phoneError}
        autoComplete="tel"
      />
      <p className="text-center text-xs text-slate-400 pt-2">
        We&apos;ll only use these details to share your itinerary. No spam, promise.
      </p>
    </motion.div>
  );
}

interface FieldProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  placeholder: string;
  value: string;
  type?: string;
  autoComplete?: string;
  error?: string;
  onChange: (value: string) => void;
  onBlur: () => void;
}

function Field({
  icon: Icon,
  label,
  placeholder,
  value,
  type = "text",
  autoComplete,
  error,
  onChange,
  onBlur,
}: FieldProps) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
        {label}
      </span>
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 bg-white transition-all ${
          error
            ? "border-rose-300 focus-within:border-rose-500 focus-within:ring-4 focus-within:ring-rose-500/15"
            : "border-slate-200 focus-within:border-cyan-500 focus-within:ring-4 focus-within:ring-cyan-500/15"
        }`}
      >
        <Icon className={`w-5 h-5 ${error ? "text-rose-400" : "text-slate-400"}`} />
        <input
          type={type}
          value={value}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none text-sm sm:text-base text-slate-900 placeholder:text-slate-400"
        />
      </div>
      {error && <span className="mt-1.5 block text-xs font-medium text-rose-600">{error}</span>}
    </label>
  );
}
