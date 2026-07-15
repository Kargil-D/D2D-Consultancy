-- Migration: add Lead Management module (leads, lead_activities)

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('Website', 'MetaAds', 'GoogleAds', 'SEO', 'WhatsApp', 'Referral', 'Manual');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('New', 'Contacted', 'FollowUp', 'QuotationSent', 'PaymentPending', 'Won', 'Lost');

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "seq" SERIAL NOT NULL,
    "customerName" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "email" TEXT,
    "destinationId" TEXT NOT NULL,
    "travelDate" TIMESTAMP(3),
    "source" "LeadSource" NOT NULL,
    "adults" INTEGER,
    "children" INTEGER,
    "assignedToId" TEXT,
    "remarks" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'New',
    "createdDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedDate" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_activities" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "leads_seq_key" ON "leads"("seq");

-- CreateIndex
CREATE INDEX "leads_destinationId_idx" ON "leads"("destinationId");

-- CreateIndex
CREATE INDEX "leads_assignedToId_idx" ON "leads"("assignedToId");

-- CreateIndex
CREATE INDEX "lead_activities_leadId_idx" ON "lead_activities"("leadId");

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "destinations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
