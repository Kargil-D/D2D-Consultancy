-- Admin-set "No. of Persons" (sets the public price breakdown's default traveler count)
-- and a free-text "Price Per Person" display field on Campaign.

ALTER TABLE "campaigns" ADD COLUMN "noOfPersons" INTEGER;
ALTER TABLE "campaigns" ADD COLUMN "pricePerPerson" TEXT;
