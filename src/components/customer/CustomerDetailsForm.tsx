"use client";

import { motion } from "framer-motion";
import { Mail, Phone, User } from "lucide-react";

interface CustomerDetailsFormProps {
  name: string;
  email: string;
  phone: string;
  onChange: (patch: { name?: string; email?: string; phone?: string }) => void;
}

/**
 * Final-step contact form. Validation is enforced by the parent planner page
 * via the regex/empty checks before enabling the Submit button.
 */
export default function CustomerDetailsForm({
  name,
  email,
  phone,
  onChange,
}: CustomerDetailsFormProps) {
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
        autoComplete="name"
      />
      <Field
        icon={Mail}
        label="Email"
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(v) => onChange({ email: v })}
        autoComplete="email"
      />
      <Field
        icon={Phone}
        label="Phone Number"
        type="tel"
        placeholder="+91 98765 43210"
        value={phone}
        onChange={(v) => onChange({ phone: v })}
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
  onChange: (value: string) => void;
}

function Field({
  icon: Icon,
  label,
  placeholder,
  value,
  type = "text",
  autoComplete,
  onChange,
}: FieldProps) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
        {label}
      </span>
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border-2 border-slate-200 bg-white focus-within:border-cyan-500 focus-within:ring-4 focus-within:ring-cyan-500/15 transition-all">
        <Icon className="w-5 h-5 text-slate-400" />
        <input
          type={type}
          value={value}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none text-sm sm:text-base text-slate-900 placeholder:text-slate-400"
        />
      </div>
    </label>
  );
}
