-- Currency Master + Currency Rate History, plus currency fields on quotation_items.

ALTER TABLE "quotation_items"
  ADD COLUMN "currencyCode" TEXT NOT NULL DEFAULT 'INR',
  ADD COLUMN "foreignAmount" DOUBLE PRECISION,
  ADD COLUMN "exchangeRate" DOUBLE PRECISION NOT NULL DEFAULT 1;

CREATE TABLE "currencies" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "exchangeRate" DOUBLE PRECISION NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'Active',
    "createdBy" TEXT,
    "createdDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,
    "updatedDate" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "currencies_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "currencies_code_key" ON "currencies"("code");

CREATE TABLE "currency_rate_history" (
    "id" TEXT NOT NULL,
    "currencyId" TEXT NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "oldRate" DOUBLE PRECISION,
    "newRate" DOUBLE PRECISION NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "changedBy" TEXT,
    "changedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "currency_rate_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "currency_rate_history_currencyId_idx" ON "currency_rate_history"("currencyId");

ALTER TABLE "currency_rate_history" ADD CONSTRAINT "currency_rate_history_currencyId_fkey"
  FOREIGN KEY ("currencyId") REFERENCES "currencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Seed the 8 supported currencies. All non-INR rates start at 1 (deliberate
-- placeholder — no live FX data source per spec; the admin sets real rates
-- immediately via Currency Master rather than trusting a fabricated figure).
INSERT INTO "currencies" ("id", "code", "name", "exchangeRate", "effectiveFrom", "status", "updatedDate")
VALUES
  (gen_random_uuid()::text, 'INR', 'Indian Rupee', 1, CURRENT_TIMESTAMP, 'Active', CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'USD', 'US Dollar', 1, CURRENT_TIMESTAMP, 'Active', CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'THB', 'Thai Baht', 1, CURRENT_TIMESTAMP, 'Active', CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'AED', 'UAE Dirham', 1, CURRENT_TIMESTAMP, 'Active', CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'SGD', 'Singapore Dollar', 1, CURRENT_TIMESTAMP, 'Active', CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'MYR', 'Malaysian Ringgit', 1, CURRENT_TIMESTAMP, 'Active', CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'IDR', 'Indonesian Rupiah', 1, CURRENT_TIMESTAMP, 'Active', CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'GBP', 'British Pound', 1, CURRENT_TIMESTAMP, 'Active', CURRENT_TIMESTAMP);
