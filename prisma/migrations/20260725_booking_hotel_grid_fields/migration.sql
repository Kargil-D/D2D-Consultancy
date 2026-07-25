-- Booking Hotels tab reworked into a grid synced from the Quotation's Pricing step —
-- adds Operations-facing booking/payment tracking fields per hotel row (Supplier Name
-- already existed as "supplier"; D2D Cost/Currency/Total Cost are mirrored read-only
-- from the linked QuotationItem, not stored here).

ALTER TABLE "booking_hotels"
  ADD COLUMN "paymentMode" "PaymentMode" NOT NULL DEFAULT 'Cash',
  ADD COLUMN "bookingDate" TIMESTAMP(3),
  ADD COLUMN "bookingPnr" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "updatedBy" TEXT NOT NULL DEFAULT '';
