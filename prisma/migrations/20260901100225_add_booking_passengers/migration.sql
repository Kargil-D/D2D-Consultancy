-- CreateEnum
CREATE TYPE "PassengerType" AS ENUM ('Adult', 'Child', 'Infant');

-- CreateEnum
CREATE TYPE "PassengerGender" AS ENUM ('Male', 'Female', 'Other');

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "adults" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "children" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "infants" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "booking_passengers" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "paxType" "PassengerType" NOT NULL DEFAULT 'Adult',
    "name" TEXT NOT NULL DEFAULT '',
    "age" INTEGER,
    "gender" "PassengerGender" NOT NULL DEFAULT 'Other',
    "contactNumber" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "booking_passengers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "booking_passengers_bookingId_idx" ON "booking_passengers"("bookingId");

-- AddForeignKey
ALTER TABLE "booking_passengers" ADD CONSTRAINT "booking_passengers_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
