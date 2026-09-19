"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, FileCheck2, FileDown, Lock, LoaderCircle, TriangleAlert, X } from "lucide-react";
import { useToast } from "@/components/admin/ui/Toast";
import type { ApiResponse } from "@/types/admin";

export interface IssuedDocumentMeta {
  issuedAt: string | null;
  stale: boolean;
}

interface IssuedDocumentControlProps {
  /** Card title once issued, e.g. "Hotel Voucher". */
  documentLabel: string;
  /** Lower-case noun used in hints, e.g. "voucher". */
  noun: string;
  generateLabel: string;
  /** Opens the stored document (a GET that never re-generates). */
  viewHref: string;
  issuedAt?: string | null;
  /** Source data changed after the document was issued. */
  stale?: boolean;
  /** Why Generate is unavailable right now (unsaved edits, nothing to issue yet); null/undefined = available. */
  blockedReason?: string | null;
  issue: () => Promise<ApiResponse<IssuedDocumentMeta | null>>;
  clear: () => Promise<ApiResponse<IssuedDocumentMeta | null>>;
  onChange: (meta: IssuedDocumentMeta) => void;
}

const formatIssued = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false });

/**
 * Generate once → view any time → remove (✕) to generate again. The document is stored, so opening
 * it never re-generates; the Generate button is locked while one exists and only re-enables after
 * the ✕ (with a quick inline confirm, since it may already have been shared). When the source data
 * changes after issuing, the card turns amber ("Out of date") to prompt a remove-and-regenerate.
 */
export default function IssuedDocumentControl({
  documentLabel, noun, generateLabel, viewHref, issuedAt, stale = false, blockedReason, issue, clear, onChange,
}: IssuedDocumentControlProps) {
  const { notify } = useToast();
  const [busy, setBusy] = useState<"issue" | "clear" | null>(null);
  const [confirming, setConfirming] = useState(false);
  const generateRef = useRef<HTMLButtonElement>(null);
  const refocusGenerate = useRef(false);

  const issued = !!issuedAt;

  useEffect(() => {
    if (!issued && refocusGenerate.current) {
      refocusGenerate.current = false;
      generateRef.current?.focus();
    }
  }, [issued]);

  const run = async (kind: "issue" | "clear") => {
    if (busy) return;
    setBusy(kind);
    try {
      const res = await (kind === "issue" ? issue() : clear());
      if (!res.success || !res.data) {
        notify(res.message || "Something went wrong", "error");
        return;
      }
      if (kind === "clear") {
        setConfirming(false);
        refocusGenerate.current = true;
      }
      onChange(res.data);
      notify(res.message, "success");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Unexpected error", "error");
    } finally {
      setBusy(null);
    }
  };

  const generateLocked = issued || !!blockedReason;
  const generateHint = issued
    ? `Remove the issued ${noun} (✕) to generate a new one`
    : blockedReason || `Generate the ${noun}`;

  return (
    <div className="flex flex-wrap items-center gap-2" aria-live="polite">
      <button
        ref={generateRef}
        type="button"
        onClick={() => run("issue")}
        disabled={generateLocked || busy !== null}
        title={generateHint}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
          generateLocked ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-60"
        }`}
      >
        {busy === "issue" ? (
          <LoaderCircle className="w-3.5 h-3.5 animate-spin" />
        ) : issued ? (
          <Lock className="w-3.5 h-3.5" />
        ) : (
          <FileDown className="w-3.5 h-3.5" />
        )}
        {busy === "issue" ? "Generating…" : generateLabel}
      </button>

      {issuedAt && !confirming && (
        <div
          className={`inline-flex items-stretch overflow-hidden rounded-lg border text-xs ${
            stale ? "border-amber-300 bg-amber-50" : "border-emerald-200 bg-emerald-50"
          }`}
        >
          <a
            href={viewHref}
            target="_blank"
            rel="noreferrer"
            title={`Open the issued ${noun}`}
            className={`inline-flex items-center gap-2 px-3 py-1.5 transition-colors ${stale ? "hover:bg-amber-100" : "hover:bg-emerald-100"}`}
          >
            <span className={`flex h-6 w-6 items-center justify-center rounded-md ${stale ? "bg-amber-200 text-amber-800" : "bg-emerald-200 text-emerald-800"}`}>
              {stale ? <TriangleAlert className="w-3.5 h-3.5" /> : <FileCheck2 className="w-3.5 h-3.5" />}
            </span>
            <span className="flex flex-col text-left leading-tight">
              <span className={`font-semibold ${stale ? "text-amber-900" : "text-emerald-900"}`}>{documentLabel}</span>
              <span className={`text-[11px] ${stale ? "text-amber-800" : "text-emerald-700"}`}>
                {stale ? "Out of date · remove to regenerate" : `Issued ${formatIssued(issuedAt)}`}
              </span>
            </span>
            <ExternalLink className={`w-3 h-3 ${stale ? "text-amber-700" : "text-emerald-700"}`} />
          </a>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            aria-label={`Remove issued ${noun}`}
            title={`Remove this ${noun} to generate a new one`}
            className={`px-2.5 border-l transition-colors hover:bg-rose-100 hover:text-rose-700 ${
              stale ? "border-amber-200 text-amber-700" : "border-emerald-200 text-emerald-700"
            }`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {issued && confirming && (
        <div className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs" role="alertdialog" aria-label={`Confirm removing the ${noun}`}>
          <span className="font-medium text-rose-900">Remove this {noun}?</span>
          <button
            type="button"
            onClick={() => run("clear")}
            disabled={busy !== null}
            className="inline-flex items-center gap-1 rounded-md bg-rose-600 px-2.5 py-1 font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
          >
            {busy === "clear" && <LoaderCircle className="w-3 h-3 animate-spin" />}
            Remove
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={busy !== null}
            className="rounded-md px-2 py-1 font-semibold text-rose-800 hover:bg-rose-100"
          >
            Keep
          </button>
        </div>
      )}
    </div>
  );
}
