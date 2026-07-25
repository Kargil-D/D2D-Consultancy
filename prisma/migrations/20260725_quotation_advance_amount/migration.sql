-- Quotation Pricing step — "Advance Amount" required to confirm a booking (defaults to 20% of
-- the selling price in the UI, editable by sales before converting the quotation into a booking).

ALTER TABLE "quotations"
  ADD COLUMN "advanceAmount" INTEGER NOT NULL DEFAULT 0;
