-- Migration: init campaigns

CREATE TABLE campaigns (
  id text PRIMARY KEY,
  name text NOT NULL,
  "destinationId" text NOT NULL REFERENCES destinations(id) ON DELETE RESTRICT,
  "packageType" text NOT NULL DEFAULT 'Standard',
  days integer NOT NULL DEFAULT 0,
  nights integer NOT NULL DEFAULT 0,
  "startingPrice" integer NOT NULL DEFAULT 0,
  "offerPrice" integer,
  thumbnail text,
  "coverBanner" text,
  "shortDescription" text NOT NULL DEFAULT '',
  highlights text[] NOT NULL DEFAULT '{}',
  inclusions text[] NOT NULL DEFAULT '{}',
  exclusions text[] NOT NULL DEFAULT '{}',
  "bestTimeToVisit" text,
  "travelTypes" text[] NOT NULL DEFAULT '{}',
  "isFeatured" boolean NOT NULL DEFAULT false,
  "isRecentlyViewed" boolean NOT NULL DEFAULT false,
  "isHeroCampaign" boolean NOT NULL DEFAULT false,
  "viewDetailsRedirect" text,
  slug text NOT NULL UNIQUE,
  "seoTitle" text,
  "seoDescription" text,
  status "Status" NOT NULL DEFAULT 'Active',
  gallery text[] NOT NULL DEFAULT '{}',
  "createdBy" text,
  "createdDate" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedBy" text,
  "updatedDate" timestamp,
  "isDeleted" boolean NOT NULL DEFAULT false
);

-- Indexes
CREATE INDEX idx_campaigns_destination ON campaigns("destinationId");
CREATE INDEX idx_campaigns_status ON campaigns(status);
