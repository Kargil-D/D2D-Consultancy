-- Activity grid dropped Pickup Location/Meeting Point/Drop Location (unused) in favor of
-- a Pax count mirrored in from the Quotation's activity, same as Duration/Activity Time.

ALTER TABLE "booking_activities"
  DROP COLUMN "pickupLocation",
  DROP COLUMN "meetingPoint",
  DROP COLUMN "dropLocation",
  ADD COLUMN "pax" INTEGER NOT NULL DEFAULT 1;
