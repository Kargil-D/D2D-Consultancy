-- Removes the Highlights/Inclusions/Exclusions tag-list fields from the Edit Campaign admin form
-- and their backing columns. Distinct from campaigns.inclusionsText/exclusionsText (the long-form
-- text fields rendered in the public campaign page's Inclusions/Exclusions section), which are
-- untouched by this migration.
ALTER TABLE "campaigns" DROP COLUMN "highlights";
ALTER TABLE "campaigns" DROP COLUMN "inclusions";
ALTER TABLE "campaigns" DROP COLUMN "exclusions";
