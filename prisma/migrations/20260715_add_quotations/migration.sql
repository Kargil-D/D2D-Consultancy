-- Migration: add Quotation Builder module (quotations, quotation_items)

-- CreateEnum
CREATE TYPE "QuotationStatus" AS ENUM ('Draft', 'Sent', 'Accepted', 'Rejected', 'Expired');

-- CreateEnum
CREATE TYPE "QuotationComponent" AS ENUM ('Hotel', 'Transfer', 'Activity', 'Visa', 'Insurance', 'Flight');

-- CreateTable
CREATE TABLE "quotations" (
    "id" TEXT NOT NULL,
    "seq" SERIAL NOT NULL,
    "leadId" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,
    "campaignId" TEXT,
    "marginPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "QuotationStatus" NOT NULL DEFAULT 'Draft',
    "shareToken" TEXT,
    "createdDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedDate" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "quotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotation_items" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "component" "QuotationComponent" NOT NULL,
    "detail" TEXT NOT NULL DEFAULT '',
    "qty" INTEGER NOT NULL DEFAULT 1,
    "cost" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "quotation_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "quotations_seq_key" ON "quotations"("seq");

-- CreateIndex
CREATE UNIQUE INDEX "quotations_shareToken_key" ON "quotations"("shareToken");

-- CreateIndex
CREATE INDEX "quotations_leadId_idx" ON "quotations"("leadId");

-- CreateIndex
CREATE INDEX "quotations_destinationId_idx" ON "quotations"("destinationId");

-- CreateIndex
CREATE INDEX "quotation_items_quotationId_idx" ON "quotation_items"("quotationId");

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "destinations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
