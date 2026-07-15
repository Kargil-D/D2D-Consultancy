-- Migration: add insurancePrice to campaigns

ALTER TABLE "campaigns" ADD COLUMN "insurancePrice" INTEGER NOT NULL DEFAULT 0;
