BEGIN;

CREATE TABLE "CareProvider" (
  "id" UUID NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "normalizedName" VARCHAR(120) NOT NULL,
  "kind" TEXT NOT NULL DEFAULT 'clinic',
  "phone" VARCHAR(80),
  "address" VARCHAR(500),
  "notes" TEXT,
  "archivedAt" TIMESTAMPTZ(3),
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CareProvider_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CareProvider_normalizedName_key" ON "CareProvider"("normalizedName");
ALTER TABLE "MedicalRecord" ADD COLUMN "providerId" UUID;

-- Deterministic IDs preserve links while capitalization and extra whitespace
-- are consolidated. Keep a real entered display name, not the lowercase key.
INSERT INTO "CareProvider" ("id", "name", "normalizedName")
SELECT md5(lower(trim(regexp_replace("provider", '[[:space:]]+', ' ', 'g'))))::uuid,
       min(trim(regexp_replace("provider", '[[:space:]]+', ' ', 'g'))),
       lower(trim(regexp_replace("provider", '[[:space:]]+', ' ', 'g')))
FROM "MedicalRecord"
WHERE "provider" IS NOT NULL AND trim(regexp_replace("provider", '[[:space:]]+', ' ', 'g')) <> ''
GROUP BY lower(trim(regexp_replace("provider", '[[:space:]]+', ' ', 'g')));

UPDATE "MedicalRecord" AS record
SET "providerId" = provider."id"
FROM "CareProvider" AS provider
WHERE provider."normalizedName" = lower(trim(regexp_replace(record."provider", '[[:space:]]+', ' ', 'g')));

ALTER TABLE "MedicalRecord" DROP COLUMN "provider";
CREATE INDEX "MedicalRecord_providerId_idx" ON "MedicalRecord"("providerId");
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_providerId_fkey"
  FOREIGN KEY ("providerId") REFERENCES "CareProvider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

COMMIT;
