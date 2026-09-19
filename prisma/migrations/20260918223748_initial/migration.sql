-- CreateTable
CREATE TABLE "Pet" (
    "id" UUID NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "species" TEXT NOT NULL,
    "breed" VARCHAR(100),
    "birthDate" DATE,
    "sex" TEXT NOT NULL DEFAULT 'unknown',
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Pet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalRecord" (
    "id" UUID NOT NULL,
    "petId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "occurredOn" DATE NOT NULL,
    "provider" VARCHAR(120),
    "notes" TEXT,
    "details" JSONB NOT NULL,
    "detailsVersion" INTEGER NOT NULL DEFAULT 1,
    "followUpOn" DATE,
    "followUpNote" VARCHAR(240),
    "followUpCompletedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "MedicalRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MedicalRecord_petId_occurredOn_idx" ON "MedicalRecord"("petId", "occurredOn");

-- CreateIndex
CREATE INDEX "MedicalRecord_type_occurredOn_idx" ON "MedicalRecord"("type", "occurredOn");

-- CreateIndex
CREATE INDEX "MedicalRecord_followUpCompletedAt_followUpOn_idx" ON "MedicalRecord"("followUpCompletedAt", "followUpOn");

-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
