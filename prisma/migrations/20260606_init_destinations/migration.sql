-- Migration: init destinations

-- enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE status AS ENUM ('Active','Inactive');

CREATE TABLE destinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  country text NOT NULL,
  state text,
  city text,
  slug text NOT NULL UNIQUE,
  "shortDescription" text NOT NULL,
  "fullDescription" text NOT NULL,
  "thumbnailImage" text,
  "bannerImage" text,
  "isPopular" boolean NOT NULL DEFAULT false,
  "displayOrder" integer NOT NULL DEFAULT 0,
  "seoTitle" text,
  "seoDescription" text,
  status status NOT NULL DEFAULT 'Active',
  "createdBy" text,
  "createdDate" timestamptz NOT NULL DEFAULT now(),
  "updatedBy" text,
  "updatedDate" timestamptz NOT NULL DEFAULT now(),
  "isDeleted" boolean NOT NULL DEFAULT false
);

-- Indexes
CREATE INDEX idx_destinations_country ON destinations(country);
CREATE INDEX idx_destinations_name ON destinations USING gin (to_tsvector('english', name));
