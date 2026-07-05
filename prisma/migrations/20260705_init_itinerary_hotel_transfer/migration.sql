-- Migration: real DB-backed tables for Itinerary, Hotel, Transfer (per-campaign) and TransferType (standalone)

CREATE TABLE itineraries (
  id text PRIMARY KEY,
  "packageId" text NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  overview text NOT NULL DEFAULT '',
  "totalDays" integer NOT NULL DEFAULT 0,
  days jsonb NOT NULL DEFAULT '[]',
  "packageIncludes" text[] NOT NULL DEFAULT '{}',
  "packageExcludes" text[] NOT NULL DEFAULT '{}',
  "termsAndConditions" text NOT NULL DEFAULT '',
  "cancellationPolicy" text NOT NULL DEFAULT '',
  faqs jsonb NOT NULL DEFAULT '[]',
  "galleryImages" text[] NOT NULL DEFAULT '{}',
  "mapLocation" text,
  "customerNotes" text,
  "ctaButtonText" text NOT NULL DEFAULT 'Send Enquiry',
  "ctaRedirect" text NOT NULL DEFAULT '/plan-trip',
  status "Status" NOT NULL DEFAULT 'Active',
  "isPublished" boolean NOT NULL DEFAULT false,
  "createdBy" text,
  "createdDate" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedBy" text,
  "updatedDate" timestamp,
  "isDeleted" boolean NOT NULL DEFAULT false
);

CREATE INDEX idx_itineraries_package ON itineraries("packageId");

CREATE TABLE hotels (
  id text PRIMARY KEY,
  "packageId" text NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  hotels jsonb NOT NULL DEFAULT '[]',
  status "Status" NOT NULL DEFAULT 'Active',
  "createdBy" text,
  "createdDate" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedBy" text,
  "updatedDate" timestamp,
  "isDeleted" boolean NOT NULL DEFAULT false
);

CREATE INDEX idx_hotels_package ON hotels("packageId");

CREATE TABLE transfers (
  id text PRIMARY KEY,
  "packageId" text NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  transfers jsonb NOT NULL DEFAULT '[]',
  status "Status" NOT NULL DEFAULT 'Active',
  "createdBy" text,
  "createdDate" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedBy" text,
  "updatedDate" timestamp,
  "isDeleted" boolean NOT NULL DEFAULT false
);

CREATE INDEX idx_transfers_package ON transfers("packageId");

CREATE TABLE transfer_types (
  id text PRIMARY KEY,
  name text NOT NULL,
  status "Status" NOT NULL DEFAULT 'Active',
  "createdBy" text,
  "createdDate" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedBy" text,
  "updatedDate" timestamp,
  "isDeleted" boolean NOT NULL DEFAULT false
);
