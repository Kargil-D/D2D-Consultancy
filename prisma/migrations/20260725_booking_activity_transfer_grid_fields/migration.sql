-- Booking Activities/Transfers tabs reworked to mirror the Hotels grid synced from the
-- Quotation's Pricing step — adds the same Operations-facing booking/payment tracking
-- fields already present on booking_hotels (D2D Cost/Total Cost are mirrored read-only
-- from the linked QuotationItem, not stored here).

ALTER TABLE "booking_activities"
  ADD COLUMN "paymentMode" "PaymentMode" NOT NULL DEFAULT 'Cash',
  ADD COLUMN "bookingDate" TIMESTAMP(3),
  ADD COLUMN "bookingPnr" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "updatedBy" TEXT NOT NULL DEFAULT '';

ALTER TABLE "booking_transfers"
  ADD COLUMN "paymentMode" "PaymentMode" NOT NULL DEFAULT 'Cash',
  ADD COLUMN "bookingDate" TIMESTAMP(3),
  ADD COLUMN "bookingPnr" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "updatedBy" TEXT NOT NULL DEFAULT '';
