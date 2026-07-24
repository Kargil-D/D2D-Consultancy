-- Quotation Step 6 — Inclusions / Exclusions free text, same convention as Campaign.inclusionsText/exclusionsText.

ALTER TABLE "quotations"
  ADD COLUMN "inclusionsText" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "exclusionsText" TEXT NOT NULL DEFAULT '';
