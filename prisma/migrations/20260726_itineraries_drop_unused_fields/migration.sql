-- Removes Itinerary columns that were only ever editable via the standalone
-- /admin/itineraries screen (now removed — itinerary editing lives inline in Campaigns,
-- covering Title/Overview/Days only). Confirmed unused by the public site: /itinerary/[id]
-- renders from the separate markdown-based itineraryService, not this table.

ALTER TABLE "itineraries"
  DROP COLUMN "packageIncludes",
  DROP COLUMN "packageExcludes",
  DROP COLUMN "termsAndConditions",
  DROP COLUMN "cancellationPolicy",
  DROP COLUMN "faqs",
  DROP COLUMN "galleryImages",
  DROP COLUMN "mapLocation",
  DROP COLUMN "customerNotes",
  DROP COLUMN "ctaButtonText",
  DROP COLUMN "ctaRedirect",
  DROP COLUMN "isPublished";
