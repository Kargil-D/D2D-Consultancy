-- CreateEnum
CREATE TYPE "EmailRecipientType" AS ENUM ('Customer', 'Supplier');

-- CreateTable
CREATE TABLE "booking_email_drafts" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "recipientType" "EmailRecipientType" NOT NULL,
    "toEmail" TEXT NOT NULL DEFAULT '',
    "cc" TEXT NOT NULL DEFAULT '',
    "bcc" TEXT NOT NULL DEFAULT '',
    "subject" TEXT NOT NULL DEFAULT '',
    "bodyHtml" TEXT NOT NULL DEFAULT '',
    "updatedDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_email_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "booking_email_drafts_bookingId_recipientType_key" ON "booking_email_drafts"("bookingId", "recipientType");

-- AddForeignKey
ALTER TABLE "booking_email_drafts" ADD CONSTRAINT "booking_email_drafts_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
