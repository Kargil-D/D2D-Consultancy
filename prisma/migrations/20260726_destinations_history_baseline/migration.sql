-- Baselines migration history against drift that was applied out-of-band (via `prisma db push`
-- during early development, before this project settled on migration files) and was never
-- captured as a migration: the destinations table gained `isDomestic`, lost its country index,
-- and `createdDate`/`updatedDate` were never actually `timestamptz` with a SQL-level default —
-- they're plain `timestamp(3)` managed by Prisma's `@default(now())`/`@updatedAt`, matching
-- every other DateTime column in this schema.

DROP INDEX "idx_destinations_country";

ALTER TABLE "destinations"
  ADD COLUMN "isDomestic" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "destinations"
  ALTER COLUMN "createdDate" TYPE TIMESTAMP(3) USING "createdDate"::timestamp(3),
  ALTER COLUMN "createdDate" SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "destinations"
  ALTER COLUMN "updatedDate" TYPE TIMESTAMP(3) USING "updatedDate"::timestamp(3),
  ALTER COLUMN "updatedDate" DROP DEFAULT;
