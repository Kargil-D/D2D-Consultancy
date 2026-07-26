-- Drops Activity Inclusions/Exclusions (unused, table is empty) and adds an Invoice upload
-- field to Activities/Transfers alongside the existing Voucher field.

ALTER TABLE "booking_activities"
  DROP COLUMN "inclusions",
  DROP COLUMN "exclusions",
  ADD COLUMN "invoiceUrl" TEXT;

ALTER TABLE "booking_transfers"
  ADD COLUMN "invoiceUrl" TEXT;
