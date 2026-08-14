/*
  Warnings:

  - Made the column `updatedDate` on table `campaigns` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedDate` on table `hotels` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedDate` on table `itineraries` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedDate` on table `transfer_types` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedDate` on table `transfers` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "campaigns" DROP CONSTRAINT "campaigns_destinationId_fkey";

-- DropForeignKey
ALTER TABLE "hotels" DROP CONSTRAINT "hotels_packageId_fkey";

-- DropForeignKey
ALTER TABLE "itineraries" DROP CONSTRAINT "itineraries_packageId_fkey";

-- DropForeignKey
ALTER TABLE "transfers" DROP CONSTRAINT "transfers_packageId_fkey";

-- DropIndex
DROP INDEX "idx_campaigns_status";

-- DropIndex
DROP INDEX "quotations_salesExecutiveId_idx";

-- AlterTable
ALTER TABLE "campaigns" ALTER COLUMN "createdDate" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedDate" SET NOT NULL,
ALTER COLUMN "updatedDate" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "hotels" ALTER COLUMN "createdDate" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedDate" SET NOT NULL,
ALTER COLUMN "updatedDate" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "itineraries" ALTER COLUMN "createdDate" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedDate" SET NOT NULL,
ALTER COLUMN "updatedDate" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "transfer_types" ADD COLUMN     "imageUrl" TEXT,
ALTER COLUMN "createdDate" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedDate" SET NOT NULL,
ALTER COLUMN "updatedDate" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "transfers" ALTER COLUMN "createdDate" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedDate" SET NOT NULL,
ALTER COLUMN "updatedDate" SET DATA TYPE TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "booking_documents_bookingId_idx" ON "booking_documents"("bookingId");

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "destinations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itineraries" ADD CONSTRAINT "itineraries_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotels" ADD CONSTRAINT "hotels_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "idx_campaigns_destination" RENAME TO "campaigns_destinationId_idx";

-- RenameIndex
ALTER INDEX "idx_hotels_package" RENAME TO "hotels_packageId_idx";

-- RenameIndex
ALTER INDEX "idx_itineraries_package" RENAME TO "itineraries_packageId_idx";

-- RenameIndex
ALTER INDEX "idx_transfers_package" RENAME TO "transfers_packageId_idx";
