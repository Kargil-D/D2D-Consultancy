-- Booking module rebuild per Operations FRD: structured per-service tables (Flight/Hotel/
-- Activity/Transfer/Visa/Insurance) replacing the generic BookingComponent, a Cost Sheet
-- table reconciled by sourceId (same pattern as QuotationItem.sourceId), Customer/Supplier
-- Payments, a Timeline event log (mirrors LeadActivity), and Internal Notes.

-- Drop the old generic per-component model in favor of the six structured tables below.
DROP TABLE IF EXISTS "booking_components";
DROP TYPE IF EXISTS "BookingComponentType";
DROP TYPE IF EXISTS "BookingComponentStatus";

-- Documents: allow multiple files per type (Customer Documents can have several uploads
-- of the same type over time) and broaden the type set to the FRD's customer-document list.
DROP INDEX IF EXISTS "booking_documents_bookingId_type_key";
ALTER TYPE "BookingDocumentType" ADD VALUE 'Aadhaar';
ALTER TYPE "BookingDocumentType" ADD VALUE 'PAN';
ALTER TYPE "BookingDocumentType" ADD VALUE 'PassportPhoto';
ALTER TYPE "BookingDocumentType" ADD VALUE 'Other';

CREATE TYPE "BookingServiceType" AS ENUM ('Flight', 'Hotel', 'Activity', 'Transfer', 'Visa', 'Insurance');
CREATE TYPE "CostSheetStatus" AS ENUM ('Pending', 'Confirmed', 'Invoiced', 'Settled');
CREATE TYPE "TourType" AS ENUM ('Private', 'SIC');
CREATE TYPE "VisaStatus" AS ENUM ('Applied', 'Approved', 'Rejected', 'Issued');
CREATE TYPE "PaymentMode" AS ENUM ('Cash', 'BankTransfer', 'Card', 'UPI', 'Cheque', 'Other');
CREATE TYPE "SettlementStatus" AS ENUM ('Pending', 'Settled', 'Partial');

CREATE TABLE "booking_flights" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "airline" TEXT NOT NULL DEFAULT '',
    "flightNumber" TEXT NOT NULL DEFAULT '',
    "pnr" TEXT NOT NULL DEFAULT '',
    "ticketNumber" TEXT NOT NULL DEFAULT '',
    "fromLocation" TEXT NOT NULL DEFAULT '',
    "toLocation" TEXT NOT NULL DEFAULT '',
    "departureAt" TIMESTAMP(3),
    "arrivalAt" TIMESTAMP(3),
    "cabinClass" TEXT NOT NULL DEFAULT '',
    "baggage" TEXT NOT NULL DEFAULT '',
    "meal" TEXT NOT NULL DEFAULT '',
    "supplier" TEXT NOT NULL DEFAULT '',
    "ticketUrl" TEXT,
    "voucherUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "booking_flights_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "booking_flights_bookingId_idx" ON "booking_flights"("bookingId");
ALTER TABLE "booking_flights" ADD CONSTRAINT "booking_flights_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "booking_hotels" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "hotelName" TEXT NOT NULL DEFAULT '',
    "hotelCategory" TEXT NOT NULL DEFAULT '',
    "checkIn" TIMESTAMP(3),
    "checkOut" TIMESTAMP(3),
    "nights" INTEGER NOT NULL DEFAULT 0,
    "rooms" INTEGER NOT NULL DEFAULT 1,
    "roomCategory" TEXT NOT NULL DEFAULT '',
    "roomType" TEXT NOT NULL DEFAULT '',
    "mealPlan" TEXT NOT NULL DEFAULT '',
    "occupancy" TEXT NOT NULL DEFAULT '',
    "amenities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "hotelAddress" TEXT NOT NULL DEFAULT '',
    "googleMapLink" TEXT,
    "hotelContactNumber" TEXT NOT NULL DEFAULT '',
    "supplier" TEXT NOT NULL DEFAULT '',
    "voucherUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "booking_hotels_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "booking_hotels_bookingId_idx" ON "booking_hotels"("bookingId");
ALTER TABLE "booking_hotels" ADD CONSTRAINT "booking_hotels_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "booking_activities" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "activityName" TEXT NOT NULL DEFAULT '',
    "activityDate" TIMESTAMP(3),
    "activityTime" TEXT NOT NULL DEFAULT '',
    "duration" TEXT NOT NULL DEFAULT '',
    "tourType" "TourType" NOT NULL DEFAULT 'Private',
    "pickupIncluded" BOOLEAN NOT NULL DEFAULT false,
    "pickupTime" TEXT NOT NULL DEFAULT '',
    "pickupLocation" TEXT NOT NULL DEFAULT '',
    "meetingPoint" TEXT NOT NULL DEFAULT '',
    "dropLocation" TEXT NOT NULL DEFAULT '',
    "inclusions" TEXT NOT NULL DEFAULT '',
    "exclusions" TEXT NOT NULL DEFAULT '',
    "supplier" TEXT NOT NULL DEFAULT '',
    "voucherUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "booking_activities_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "booking_activities_bookingId_idx" ON "booking_activities"("bookingId");
ALTER TABLE "booking_activities" ADD CONSTRAINT "booking_activities_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "booking_transfers" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "transferType" TEXT NOT NULL DEFAULT '',
    "vehicleType" TEXT NOT NULL DEFAULT '',
    "mode" "TourType" NOT NULL DEFAULT 'Private',
    "pickupAt" TIMESTAMP(3),
    "pickupLocation" TEXT NOT NULL DEFAULT '',
    "dropLocation" TEXT NOT NULL DEFAULT '',
    "driverName" TEXT NOT NULL DEFAULT '',
    "driverMobile" TEXT NOT NULL DEFAULT '',
    "vehicleNumber" TEXT NOT NULL DEFAULT '',
    "supplier" TEXT NOT NULL DEFAULT '',
    "voucherUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "booking_transfers_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "booking_transfers_bookingId_idx" ON "booking_transfers"("bookingId");
ALTER TABLE "booking_transfers" ADD CONSTRAINT "booking_transfers_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "booking_visas" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT '',
    "visaType" TEXT NOT NULL DEFAULT '',
    "visaNumber" TEXT NOT NULL DEFAULT '',
    "applicationDate" TIMESTAMP(3),
    "issueDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "status" "VisaStatus" NOT NULL DEFAULT 'Applied',
    "supplier" TEXT NOT NULL DEFAULT '',
    "visaCopyUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "booking_visas_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "booking_visas_bookingId_idx" ON "booking_visas"("bookingId");
ALTER TABLE "booking_visas" ADD CONSTRAINT "booking_visas_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "booking_insurances" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "insuranceCompany" TEXT NOT NULL DEFAULT '',
    "policyNumber" TEXT NOT NULL DEFAULT '',
    "planName" TEXT NOT NULL DEFAULT '',
    "coverageAmount" INTEGER NOT NULL DEFAULT 0,
    "travelStartDate" TIMESTAMP(3),
    "travelEndDate" TIMESTAMP(3),
    "policyPdfUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "booking_insurances_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "booking_insurances_bookingId_idx" ON "booking_insurances"("bookingId");
ALTER TABLE "booking_insurances" ADD CONSTRAINT "booking_insurances_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "booking_cost_sheet_entries" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "serviceType" "BookingServiceType" NOT NULL,
    "sourceId" TEXT NOT NULL,
    "supplierName" TEXT NOT NULL DEFAULT '',
    "serviceName" TEXT NOT NULL DEFAULT '',
    "dmcCost" INTEGER NOT NULL DEFAULT 0,
    "bookingCost" INTEGER NOT NULL DEFAULT 0,
    "settlementCost" INTEGER NOT NULL DEFAULT 0,
    "sellingPrice" INTEGER NOT NULL DEFAULT 0,
    "status" "CostSheetStatus" NOT NULL DEFAULT 'Pending',
    "remarks" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "booking_cost_sheet_entries_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "booking_cost_sheet_entries_bookingId_idx" ON "booking_cost_sheet_entries"("bookingId");
ALTER TABLE "booking_cost_sheet_entries" ADD CONSTRAINT "booking_cost_sheet_entries_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "booking_customer_payments" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "paymentMode" "PaymentMode" NOT NULL DEFAULT 'Cash',
    "amount" INTEGER NOT NULL,
    "transactionReference" TEXT,
    "remarks" TEXT,
    "createdDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "booking_customer_payments_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "booking_customer_payments_bookingId_idx" ON "booking_customer_payments"("bookingId");
ALTER TABLE "booking_customer_payments" ADD CONSTRAINT "booking_customer_payments_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "booking_supplier_payments" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "supplierName" TEXT NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "amount" INTEGER NOT NULL,
    "paymentMode" "PaymentMode" NOT NULL DEFAULT 'Cash',
    "transactionReference" TEXT,
    "settlementStatus" "SettlementStatus" NOT NULL DEFAULT 'Pending',
    "createdDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "booking_supplier_payments_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "booking_supplier_payments_bookingId_idx" ON "booking_supplier_payments"("bookingId");
ALTER TABLE "booking_supplier_payments" ADD CONSTRAINT "booking_supplier_payments_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "booking_timeline_events" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "booking_timeline_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "booking_timeline_events_bookingId_idx" ON "booking_timeline_events"("bookingId");
ALTER TABLE "booking_timeline_events" ADD CONSTRAINT "booking_timeline_events_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "booking_notes" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL DEFAULT '',
    "message" TEXT NOT NULL,
    "createdDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "booking_notes_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "booking_notes_bookingId_idx" ON "booking_notes"("bookingId");
ALTER TABLE "booking_notes" ADD CONSTRAINT "booking_notes_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
