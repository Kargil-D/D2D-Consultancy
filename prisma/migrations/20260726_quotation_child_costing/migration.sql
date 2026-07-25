-- Quotation Step 7 (Pricing) — "Include child count for costing" toggle. When on, the public
-- quote's Price per Person split weights 80% of package cost across adults, 20% across children.

ALTER TABLE "quotations"
  ADD COLUMN "includeChildCosting" BOOLEAN NOT NULL DEFAULT false;
