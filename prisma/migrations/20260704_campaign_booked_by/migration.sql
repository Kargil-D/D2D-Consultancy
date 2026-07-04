-- Migration: add booked-by social-proof fields to campaigns

ALTER TABLE campaigns
  ADD COLUMN "bookedByName" text,
  ADD COLUMN "bookedByCity" text,
  ADD COLUMN "bookedByAgo" text;
