"use client";

import { useRef, useState } from "react";
import { FileText, Upload, X, CheckCircle2 } from "lucide-react";
import { uploadImage } from "@/lib/adminApi";

interface DocumentUploadProps {
  label: string;
  value?: string;
  onChange: (url: string) => void;
}

/**
 * Document upload slot for the Booking workspace (Passport/Visa/Flight
 * Ticket/Insurance). Reuses the same mock data-URL upload as the admin
 * ImageUpload component — no real file storage exists in this app yet — just
 * widened to accept PDFs alongside images, and shown as a generic file state
 * rather than an image preview since documents are often PDFs/scans.
 */
export default function DocumentUpload({ label, value, onChange }: DocumentUploadProps) {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handle = async (file: File) => {
    setUploading(true);
    const res = await uploadImage(file);
    setUploading(false);
    if (res.success) onChange(res.data.url);
  };

  return (
    <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0 ${value ? "bg-emerald-100 text-emerald-600" : "bg-slate-200 text-slate-500"}`}>
          {value ? <CheckCircle2 className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
        </span>
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</div>
          <div className="text-sm text-slate-700 truncate">{value ? "Uploaded" : "No file uploaded"}</div>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="p-2 rounded-lg text-rose-600 hover:bg-rose-50"
            aria-label={`Remove ${label}`}
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100"
        >
          <Upload className="w-3.5 h-3.5" />
          {uploading ? "Uploading…" : value ? "Replace" : "Upload"}
        </button>
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handle(f);
        }}
      />
    </div>
  );
}
