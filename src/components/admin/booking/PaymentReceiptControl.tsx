"use client";

import IssuedDocumentControl from "@/components/admin/booking/IssuedDocumentControl";
import { bookingsApi } from "@/lib/adminApi";

interface PaymentReceiptMeta {
  paymentReceiptIssuedAt: string | null;
  paymentReceiptStale: boolean;
}

interface PaymentReceiptControlProps {
  bookingId: string;
  issuedAt?: string | null;
  /** Payments/trip details changed after the receipt was issued. */
  stale?: boolean;
  /** No customer payment recorded yet — there is nothing to acknowledge. */
  hasPayments: boolean;
  onChange: (meta: PaymentReceiptMeta) => void;
}

const toMeta = (data: PaymentReceiptMeta) => ({ issuedAt: data.paymentReceiptIssuedAt, stale: data.paymentReceiptStale });

/** Payment Receipt: generate → view → ✕ to remove and regenerate (see IssuedDocumentControl). */
export default function PaymentReceiptControl({ bookingId, issuedAt, stale = false, hasPayments, onChange }: PaymentReceiptControlProps) {
  const wrap = (call: () => ReturnType<typeof bookingsApi.issuePaymentReceipt>) => async () => {
    const res = await call();
    return { ...res, data: res.data ? toMeta(res.data) : null };
  };

  return (
    <IssuedDocumentControl
      documentLabel="Payment Receipt"
      noun="receipt"
      generateLabel="Generate Payment Receipt"
      viewHref={`/api/admin/bookings/${bookingId}/payment-receipt`}
      issuedAt={issuedAt}
      stale={stale}
      blockedReason={hasPayments ? null : "Record a customer payment first — the receipt acknowledges payments received"}
      issue={wrap(() => bookingsApi.issuePaymentReceipt(bookingId))}
      clear={wrap(() => bookingsApi.clearPaymentReceipt(bookingId))}
      onChange={(meta) => onChange({ paymentReceiptIssuedAt: meta.issuedAt, paymentReceiptStale: meta.stale })}
    />
  );
}
