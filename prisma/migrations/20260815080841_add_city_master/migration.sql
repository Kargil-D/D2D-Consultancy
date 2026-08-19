-- CreateTable
CREATE TABLE "cities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "state" TEXT,
    "country" TEXT,
    "status" "Status" NOT NULL DEFAULT 'Active',
    "createdBy" TEXT,
    "createdDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,
    "updatedDate" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "destination_cities" (
    "id" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "createdDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "destination_cities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "destination_cities_cityId_idx" ON "destination_cities"("cityId");

-- CreateIndex
CREATE UNIQUE INDEX "destination_cities_destinationId_cityId_key" ON "destination_cities"("destinationId", "cityId");

-- AddForeignKey
ALTER TABLE "destination_cities" ADD CONSTRAINT "destination_cities_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "destinations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "destination_cities" ADD CONSTRAINT "destination_cities_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill: turn each existing destinations.city free-text value into a City master row (one
-- per distinct trimmed, case-insensitive name) and link it via destination_cities, so editing a
-- pre-existing destination shows its old city as a preselected chip instead of losing the data.
-- destinations.city itself is left in place, untouched, for backward compatibility.
INSERT INTO "cities" ("id", "name", "country", "updatedDate")
SELECT gen_random_uuid()::text, sub.name, sub.country, CURRENT_TIMESTAMP
FROM (
    SELECT DISTINCT ON (lower(trim(d."city"))) trim(d."city") AS name, d."country" AS country
    FROM "destinations" d
    WHERE d."city" IS NOT NULL AND trim(d."city") <> ''
    ORDER BY lower(trim(d."city")), d."createdDate" ASC
) sub;

INSERT INTO "destination_cities" ("id", "destinationId", "cityId")
SELECT gen_random_uuid()::text, d."id", c."id"
FROM "destinations" d
JOIN "cities" c ON lower(c."name") = lower(trim(d."city"))
WHERE d."city" IS NOT NULL AND trim(d."city") <> '';
