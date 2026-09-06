-- AlterTable
ALTER TABLE "leads" ADD COLUMN "mobileNormalized" TEXT NOT NULL DEFAULT '';

-- Backfill existing rows: last 10 digits of the phone with all non-digit characters stripped,
-- matching src/lib/phone.ts#normalizeMobile.
UPDATE "leads" SET "mobileNormalized" = RIGHT(REGEXP_REPLACE(mobile, '[^0-9]', '', 'g'), 10);

-- CreateIndex
CREATE INDEX "leads_mobileNormalized_idx" ON "leads"("mobileNormalized");
