import type { Pet, MedicalRecord, CareProvider } from '@/generated/prisma/client';
import { providerSchema, type ProviderDto } from '@/domain/providers';
import { dateOnly } from '@/domain/dates';
import { recordSchema, petSchema } from '@/domain/schemas';
import type { PetDto, RecordDto } from '@/domain/types';
export function petDto(pet: Pet): PetDto {
  const fields = petSchema.parse({
    name: pet.name,
    species: pet.species,
    breed: pet.breed,
    birthDate: dateOnly(pet.birthDate),
    sex: pet.sex,
    notes: pet.notes,
  });
  return {
    ...fields,
    id: pet.id,
    createdAt: pet.createdAt.toISOString(),
    updatedAt: pet.updatedAt.toISOString(),
  };
}
export function recordDto(
  record: MedicalRecord & { pet: Pet; provider: CareProvider | null },
): RecordDto {
  const fields = recordSchema.parse({
    type: record.type,
    title: record.title,
    occurredOn: dateOnly(record.occurredOn),
    providerId: record.providerId,
    notes: record.notes,
    details: record.details,
    followUpOn: dateOnly(record.followUpOn),
    followUpNote: record.followUpNote,
  });
  return {
    ...fields,
    id: record.id,
    petId: record.petId,
    pet: petDto(record.pet),
    provider: record.provider ? providerDto(record.provider) : null,
    detailsVersion: record.detailsVersion,
    followUpCompletedAt: record.followUpCompletedAt?.toISOString() ?? null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export function providerDto(
  provider: CareProvider & { _count?: { records: number } },
): ProviderDto {
  return {
    ...providerSchema.parse({
      name: provider.name,
      kind: provider.kind,
      phone: provider.phone,
      address: provider.address,
      notes: provider.notes,
    }),
    id: provider.id,
    archivedAt: provider.archivedAt?.toISOString() ?? null,
    recordCount: provider._count?.records ?? 0,
  };
}
