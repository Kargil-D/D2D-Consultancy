-- AlterTable
ALTER TABLE "bookings"
  ADD COLUMN "paymentReceipt" JSONB,
  ADD COLUMN "paymentReceiptHash" TEXT,
  ADD COLUMN "paymentReceiptIssuedAt" TIMESTAMP(3);
