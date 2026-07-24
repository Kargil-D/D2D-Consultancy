"use client";

import { useState } from "react";
import { FileText, Trash2, FileDown, Link as LinkIcon } from "lucide-react";
import ImageUpload from "@/components/admin/ui/ImageUpload";
import { Field, selectCls } from "@/components/admin/ui/Field";
import type { AdminBookingDocument, BookingDocumentType } from "@/types/admin";

interface Props {
  bookingId: string;
  documents: AdminBookingDocument[];
  onUpload: (type: BookingDocumentType, url: string) => Promise<void>;
  onRemove: (docId: string) => Promise<void>;
  quotationId: string | null;
  shareUrl: string | null;
}

const CUSTOMER_DOC_TYPES: { type: BookingDocumentType; label: string }[] = [
  { type: "Passport", label: "Passport" },
  { type: "Visa", label: "Visa" },
  { type: "Aadhaar", label: "Aadhaar" },
  { type: "PAN", label: "PAN" },
  { type: "PassportPhoto", label: "Passport Photo" },
  { type: "Other", label: "Other" },
];

export default function BookingDocumentsTab({ bookingId, documents, onUpload, onRemove, quotationId, shareUrl }: Props) {
  const [type, setType] = useState<BookingDocumentType>("Passport");

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-3">Customer Documents</h3>
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <Field label="Document Type">
            <select className={selectCls} value={type} onChange={(e) => setType(e.target.value as BookingDocumentType)}>
              {CUSTOMER_DOC_TYPES.map((d) => (<option key={d.type} value={d.type}>{d.label}</option>))}
            </select>
          </Field>
          <div className="md:col-span-2">
            <ImageUpload value="" onChange={(url) => url && onUpload(type, url)} label={`Upload ${type}`} aspect="4/3" />
          </div>
        </div>
        {documents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {documents.map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 shrink-0"><FileText className="w-5 h-5" /></span>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">{d.type}</div>
                    <a href={d.url} target="_blank" rel="noreferrer" className="text-sm text-blue-700 hover:underline truncate block">View file</a>
                  </div>
                </div>
                <button type="button" onClick={() => onRemove(d.id)} className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 shrink-0" aria-label="Remove document">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center py-6 text-sm text-slate-500">No customer documents uploaded yet.</p>
        )}
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-3">Booking Documents</h3>
        <p className="text-xs text-slate-500 mb-3">Generated on demand — nothing to upload here.</p>
        <div className="space-y-2">
          <BookingDocLink icon={<LinkIcon className="w-4 h-4" />} label="Quotation Web Link" href={shareUrl} disabledHint="No shareable link generated yet" />
          <BookingDocLink icon={<FileDown className="w-4 h-4" />} label="Quotation PDF" href={quotationId ? `/api/admin/quotations/${quotationId}/pdf` : null} disabledHint="No quotation linked" />
          <BookingDocLink icon={<FileDown className="w-4 h-4" />} label="Travel Voucher" href={`/api/admin/bookings/${bookingId}/voucher`} />
          <BookingDocLink icon={<FileDown className="w-4 h-4" />} label="Customer Invoice" href={`/api/admin/bookings/${bookingId}/invoice?kind=customer`} />
          <BookingDocLink icon={<FileDown className="w-4 h-4" />} label="Supplier Invoice" href={`/api/admin/bookings/${bookingId}/invoice?kind=supplier`} />
        </div>
      </div>
    </div>
  );
}

function BookingDocLink({ icon, label, href, disabledHint }: { icon: React.ReactNode; label: string; href?: string | null; disabledHint?: string }) {
  if (!href) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3 text-slate-400">
        {icon} <span className="text-sm">{label}</span> <span className="text-xs ml-auto">{disabledHint}</span>
      </div>
    );
  }
  return (
    <a href={href} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-slate-700 hover:bg-slate-50">
      {icon} <span className="text-sm font-medium">{label}</span>
    </a>
  );
}
