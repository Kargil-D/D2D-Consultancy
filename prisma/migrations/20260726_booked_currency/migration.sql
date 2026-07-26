-- Records the currency the Booked Cost figure is actually denominated in (the supplier may
-- be paid in a foreign currency), alongside the existing Payment Mode/Booking Date fields.

ALTER TABLE "booking_hotels" ADD COLUMN "bookedCurrency" TEXT NOT NULL DEFAULT 'INR';
ALTER TABLE "booking_activities" ADD COLUMN "bookedCurrency" TEXT NOT NULL DEFAULT 'INR';
ALTER TABLE "booking_transfers" ADD COLUMN "bookedCurrency" TEXT NOT NULL DEFAULT 'INR';
