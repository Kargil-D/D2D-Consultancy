-- Simple daily attendance roster (Present/Absent per employee per day) — no shift types.

CREATE TYPE "RosterStatus" AS ENUM ('Present', 'Absent');

CREATE TABLE "roster_entries" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" "RosterStatus" NOT NULL,
    "remarks" TEXT NOT NULL DEFAULT '',
    "markedBy" TEXT NOT NULL DEFAULT '',
    "createdDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roster_entries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "roster_entries_employeeId_date_key" ON "roster_entries"("employeeId", "date");
CREATE INDEX "roster_entries_date_idx" ON "roster_entries"("date");

ALTER TABLE "roster_entries" ADD CONSTRAINT "roster_entries_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
