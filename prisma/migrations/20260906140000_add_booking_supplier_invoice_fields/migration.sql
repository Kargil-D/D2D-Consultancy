-- AlterTable
ALTER TABLE "bookings"
  ADD COLUMN "supplierTrackId" TEXT,
  ADD COLUMN "supplierInvoiceAmount" INTEGER,
  ADD COLUMN "supplierInvoiceUrl" TEXT;
