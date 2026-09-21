ALTER TABLE "CareProvider" ADD COLUMN "timeZone" VARCHAR(100);
ALTER TABLE "MedicalRecord" ADD COLUMN "followUpProviderId" UUID,
 ADD COLUMN "followUpAt" TIMESTAMPTZ(3), ADD COLUMN "followUpTimeZone" VARCHAR(100);
UPDATE "MedicalRecord" SET "followUpProviderId" = "providerId" WHERE "followUpOn" IS NOT NULL;
CREATE INDEX "MedicalRecord_followUpProviderId_idx" ON "MedicalRecord"("followUpProviderId");
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_followUpProviderId_fkey"
 FOREIGN KEY ("followUpProviderId") REFERENCES "CareProvider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_schedule_check" CHECK (
 ("followUpAt" IS NULL OR ("followUpOn" IS NOT NULL AND "followUpTimeZone" IS NOT NULL AND "followUpProviderId" IS NOT NULL))
 AND ("followUpOn" IS NOT NULL OR ("followUpProviderId" IS NULL AND "followUpTimeZone" IS NULL))
);
