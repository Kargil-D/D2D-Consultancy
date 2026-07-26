-- Adds an optional description, used when the customer document Type is "Other" to record
-- what the file actually is.

ALTER TABLE "booking_documents"
  ADD COLUMN "description" TEXT;
