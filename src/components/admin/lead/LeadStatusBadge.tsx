import type { LeadStatus } from "@/types/admin";

const STATUS_STYLES: Record<LeadStatus, string> = {
  New: "bg-blue-50 text-blue-700 border-blue-100",
  Contacted: "bg-cyan-50 text-cyan-700 border-cyan-100",
  FollowUp: "bg-amber-50 text-amber-700 border-amber-100",
  QuotationSent: "bg-purple-50 text-purple-700 border-purple-100",
  PaymentPending: "bg-orange-50 text-orange-700 border-orange-100",
  Won: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Lost: "bg-rose-50 text-rose-700 border-rose-100",
};

const STATUS_LABELS: Record<LeadStatus, string> = {
  New: "New",
  Contacted: "Contacted",
  FollowUp: "Follow Up",
  QuotationSent: "Quotation Sent",
  PaymentPending: "Payment Pending",
  Won: "Won",
  Lost: "Lost",
};

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

export const LEAD_STATUS_LABELS = STATUS_LABELS;
