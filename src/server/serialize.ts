import type { Pet, MedicalRecord } from '@/generated/prisma/client';
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
export function recordDto(record: MedicalRecord & { pet: Pet }): RecordDto {
  const fields = recordSchema.parse({
    type: record.type,
    title: record.title,
    occurredOn: dateOnly(record.occurredOn),
    provider: record.provider,
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
    detailsVersion: record.detailsVersion,
    followUpCompletedAt: record.followUpCompletedAt?.toISOString() ?? null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}
