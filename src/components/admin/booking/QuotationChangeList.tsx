"use client";

import type { QuotationChange } from "@/types/admin";

const SECTION_ORDER: QuotationChange["section"][] = ["Trip", "Hotels", "Activities", "Transfers", "Pricing", "Other"];

/** "What changed" list inside the booking's "Quotation has been updated" prompt, grouped by section. */
export default function QuotationChangeList({ changes }: { changes?: QuotationChange[] | null }) {
  if (!changes) {
    return (
      <p className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-500">
        Change details aren&apos;t available for this update — it was made before change tracking was added. Open
        the quotation to review it. Changes made from now on will be listed here.
      </p>
    );
  }

  const groups = SECTION_ORDER.map((section) => ({ section, items: changes.filter((c) => c.section === section) })).filter((g) => g.items.length > 0);

  return (
    <div className="rounded-lg border border-slate-200 divide-y divide-slate-100">
      <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 bg-slate-50">What changed</div>
      {groups.map((g) => (
        <div key={g.section} className="px-3 py-2">
          <div className="text-xs font-semibold text-slate-700">{g.section}</div>
          <ul className="mt-1 space-y-0.5 list-disc pl-4">
            {g.items.map((c, i) => (
              <li key={i} className="text-xs text-slate-600 break-words">{c.text}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
