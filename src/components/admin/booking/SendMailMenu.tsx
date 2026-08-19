"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Send, User, Building2, ChevronDown } from "lucide-react";

interface SendMailMenuProps {
  bookingId: string;
}

const OPTIONS = [
  {
    type: "Customer" as const,
    icon: User,
    title: "Send to Customer",
    description: "Quotation/booking confirmation with travel details, sent to the customer's email.",
  },
  {
    type: "Supplier" as const,
    icon: Building2,
    title: "Send to Supplier",
    description: "Booking request with trip details and service requirements, sent to the supplier.",
  },
];

export default function SendMailMenu({ bookingId }: SendMailMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 text-white text-xs font-semibold hover:bg-cyan-700"
      >
        <Send className="w-3.5 h-3.5" /> Send Mail
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
          {OPTIONS.map(({ type, icon: Icon, title, description }) => (
            <Link
              key={type}
              href={`/admin/bookings/${bookingId}/mail?type=${type}`}
              onClick={() => setOpen(false)}
              className="flex items-start gap-3 p-3.5 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0"
            >
              <span className="flex items-center justify-center w-9 h-9 rounded-full bg-cyan-50 text-cyan-600 flex-shrink-0">
                <Icon className="w-4.5 h-4.5" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-slate-900">{title}</span>
                <span className="block text-xs text-slate-500 mt-0.5 leading-snug">{description}</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
