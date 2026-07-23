-- Links a costing row back to the hotel/activity/transfer it was auto-generated from,
-- so the Pricing step can reconcile automatically as those are added/edited/removed.

ALTER TABLE "quotation_items"
  ADD COLUMN "sourceId" TEXT;
