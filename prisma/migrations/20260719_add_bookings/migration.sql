-- Migration: add Booking module (bookings, booking_documents, booking_components)

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('Assigned', 'DmcSent', 'AwaitingConfirmation', 'Confirmed', 'VoucherGenerated', 'Booked');

-- CreateEnum
CREATE TYPE "BookingComponentType" AS ENUM ('Hotel', 'Transfer', 'Activity', 'Visa');

-- CreateEnum
CREATE TYPE "BookingComponentStatus" AS ENUM ('Pending', 'Confirmed', 'Cancelled', 'Approved', 'Rejected');

-- CreateEnum
CREATE TYPE "BookingDocumentType" AS ENUM ('Passport', 'Visa', 'FlightTicket', 'Insurance');

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "seq" SERIAL NOT NULL,
    "leadId" TEXT NOT NULL,
    "quotationId" TEXT,
    "destinationId" TEXT NOT NULL,
    "travelDate" TIMESTAMP(3),
    "bookingExecutiveId" TEXT,
    "customerSupportId" TEXT,
    "totalAmount" INTEGER NOT NULL DEFAULT 0,
    "status" "BookingStatus" NOT NULL DEFAULT 'Assigned',
    "remarks" TEXT,
    "dmcName" TEXT,
    "dmcEmailSentDate" TIMESTAMP(3),
    "dmcResponse" TEXT,
    "dmcRemarks" TEXT,
    "createdDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedDate" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_documents" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "type" "BookingDocumentType" NOT NULL,
    "url" TEXT NOT NULL,
    "uploadedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_components" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "component" "BookingComponentType" NOT NULL,
    "detail" TEXT NOT NULL DEFAULT '',
    "status" "BookingComponentStatus" NOT NULL DEFAULT 'Pending',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "booking_components_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bookings_seq_key" ON "bookings"("seq");

-- CreateIndex
CREATE INDEX "bookings_leadId_idx" ON "bookings"("leadId");

-- CreateIndex
CREATE INDEX "bookings_bookingExecutiveId_idx" ON "bookings"("bookingExecutiveId");

-- CreateIndex
CREATE INDEX "bookings_customerSupportId_idx" ON "bookings"("customerSupportId");

-- CreateIndex
CREATE UNIQUE INDEX "booking_documents_bookingId_type_key" ON "booking_documents"("bookingId", "type");

-- CreateIndex
CREATE INDEX "booking_components_bookingId_idx" ON "booking_components"("bookingId");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "quotations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "destinations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_bookingExecutiveId_fkey" FOREIGN KEY ("bookingExecutiveId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_customerSupportId_fkey" FOREIGN KEY ("customerSupportId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_documents" ADD CONSTRAINT "booking_documents_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_components" ADD CONSTRAINT "booking_components_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
