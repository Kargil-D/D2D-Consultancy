"use client";

import { FileDown, FileText } from "lucide-react";

interface Props {
  label: string;
  /** Voucher PDF endpoint — undefined until the row has been saved (has a real id). */
  href?: string;
}

/** Same visual shape as DocumentUpload, but the voucher is generated on demand from the row's own saved data rather than manually uploaded. */
export default function GenerateVoucherLink({ label, href }: Props) {
  return (
    <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0 bg-slate-200 text-slate-500">
          <FileText className="w-5 h-5" />
        </span>
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</div>
          <div className="text-sm text-slate-700 truncate">{href ? "Generated from saved details" : "Save this row first"}</div>
        </div>
      </div>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 flex-shrink-0"
        >
          <FileDown className="w-3.5 h-3.5" /> Generate
        </a>
      ) : (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-300 flex-shrink-0">
          <FileDown className="w-3.5 h-3.5" /> Generate
        </span>
      )}
    </div>
  );
}
