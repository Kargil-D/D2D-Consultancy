-- Destination admin form — "Important Notes" freeform field (bulleted lines, entered in the admin UI).

ALTER TABLE "destinations"
  ADD COLUMN "importantNotes" TEXT;
