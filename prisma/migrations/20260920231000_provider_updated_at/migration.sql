-- Prisma manages updatedAt on writes; align the database with schema.prisma.
ALTER TABLE "CareProvider" ALTER COLUMN "updatedAt" DROP DEFAULT;
