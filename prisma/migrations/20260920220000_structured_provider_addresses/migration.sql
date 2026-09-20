-- Preserve legacy text verbatim. Do not guess how to split a postal address.
ALTER TABLE "CareProvider" RENAME COLUMN "address" TO "addressLine1";
ALTER TABLE "CareProvider"
  ADD COLUMN "addressLine2" VARCHAR(120),
  ADD COLUMN "city" VARCHAR(100),
  ADD COLUMN "state" VARCHAR(2),
  ADD COLUMN "zip" VARCHAR(10);
