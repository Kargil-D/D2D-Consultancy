-- Hotel Master (searchable hotel catalog for the Quotation Hotel step), plus the
-- Quotation 5-step wizard fields (customer/trip/traveller/other details + itinerary/
-- hotel-options/transfers/activities content, all manual-entry JSON — no pricing).

ALTER TABLE "leads"
  ADD COLUMN "companyName" TEXT;

CREATE TABLE "hotel_master" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "destinationId" TEXT,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "description" TEXT NOT NULL DEFAULT '',
    "category" TEXT,
    "roomTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "mealPlans" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "amenities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "googleMapUrl" TEXT,
    "website" TEXT,
    "status" "Status" NOT NULL DEFAULT 'Active',
    "createdBy" TEXT,
    "createdDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,
    "updatedDate" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "hotel_master_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "hotel_master_destinationId_idx" ON "hotel_master"("destinationId");

ALTER TABLE "hotel_master"
  ADD CONSTRAINT "hotel_master_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "destinations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "quotations"
  ADD COLUMN "travelDate" TIMESTAMP(3),
  ADD COLUMN "days" INTEGER,
  ADD COLUMN "nights" INTEGER,
  ADD COLUMN "adults" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "children" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "infants" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "salesExecutiveId" TEXT,
  ADD COLUMN "source" "LeadSource",
  ADD COLUMN "validUntil" TIMESTAMP(3),
  ADD COLUMN "internalNotes" TEXT,
  ADD COLUMN "itineraryMode" TEXT NOT NULL DEFAULT 'custom',
  ADD COLUMN "itineraryDays" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "hotelOptions" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "transfers" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "activities" JSONB NOT NULL DEFAULT '[]';

CREATE INDEX "quotations_salesExecutiveId_idx" ON "quotations"("salesExecutiveId");

ALTER TABLE "quotations"
  ADD CONSTRAINT "quotations_salesExecutiveId_fkey" FOREIGN KEY ("salesExecutiveId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
