-- AlterTable
ALTER TABLE "bookings"
  ADD COLUMN "hotelVoucher" JSONB,
  ADD COLUMN "hotelVoucherHash" TEXT,
  ADD COLUMN "hotelVoucherIssuedAt" TIMESTAMP(3);
