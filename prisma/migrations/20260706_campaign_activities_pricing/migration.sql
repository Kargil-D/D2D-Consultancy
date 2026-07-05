-- Migration: add activities, inclusions/exclusions text, and price breakdown fields to campaigns

ALTER TABLE campaigns
  ADD COLUMN activities jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN "inclusionsText" text NOT NULL DEFAULT '',
  ADD COLUMN "exclusionsText" text NOT NULL DEFAULT '',
  ADD COLUMN "packageCost" integer NOT NULL DEFAULT 0,
  ADD COLUMN "platformFee" integer NOT NULL DEFAULT 0,
  ADD COLUMN "gstPercent" double precision NOT NULL DEFAULT 5,
  ADD COLUMN "marginPrice" integer NOT NULL DEFAULT 0;
