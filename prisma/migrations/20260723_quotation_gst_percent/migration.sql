-- GST%, editable, defaults to 5 — same pattern as Campaign.gstPercent.

ALTER TABLE "quotations"
  ADD COLUMN "gstPercent" DOUBLE PRECISION NOT NULL DEFAULT 5;
