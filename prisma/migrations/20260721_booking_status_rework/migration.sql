-- Replace BookingStatus enum (Assigned/DmcSent/AwaitingConfirmation/Confirmed/VoucherGenerated/Booked)
-- with the new 5-stage pipeline (Won/Booked/OnTrip/Completed/Cancelled).
-- Existing rows are remapped: all pre-voucher stages -> Won, VoucherGenerated/Booked -> Booked.

ALTER TYPE "BookingStatus" RENAME TO "BookingStatus_old";

CREATE TYPE "BookingStatus" AS ENUM ('Won', 'Booked', 'OnTrip', 'Completed', 'Cancelled');

ALTER TABLE "bookings" ADD COLUMN "status_new" "BookingStatus";

UPDATE "bookings" SET "status_new" = (
  CASE "status"::text
    WHEN 'Assigned' THEN 'Won'
    WHEN 'DmcSent' THEN 'Won'
    WHEN 'AwaitingConfirmation' THEN 'Won'
    WHEN 'Confirmed' THEN 'Won'
    WHEN 'VoucherGenerated' THEN 'Booked'
    WHEN 'Booked' THEN 'Booked'
  END
)::"BookingStatus";

ALTER TABLE "bookings" ALTER COLUMN "status_new" SET NOT NULL;
ALTER TABLE "bookings" ALTER COLUMN "status_new" SET DEFAULT 'Won';

ALTER TABLE "bookings" DROP COLUMN "status";
ALTER TABLE "bookings" RENAME COLUMN "status_new" TO "status";

DROP TYPE "BookingStatus_old";
