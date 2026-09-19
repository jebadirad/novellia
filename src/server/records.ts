import 'server-only';
import { prisma } from './database';
import { recordDto } from './serialize';
import { AppError, missing } from './errors';
import { dateOnly, toDate } from '@/domain/dates';
import type { RecordInput, RecordQuery } from '@/domain/schemas';
import type { Prisma } from '@/generated/prisma/client';

export async function getRecord(petId: string, id: string) {
  const record = await prisma.medicalRecord.findFirst({
    where: { id, petId },
    include: { pet: true },
  });
  if (!record) throw missing();
  return recordDto(record);
}
export async function listRecords(query: RecordQuery) {
  const direction = query.sort === 'oldest' ? 'asc' : 'desc';
  const where: Prisma.MedicalRecordWhereInput = {
    ...(query.petId && { petId: query.petId }),
    ...(query.type && { type: query.type }),
    ...((query.from || query.to) && {
      occurredOn: {
        ...(query.from && { gte: toDate(query.from)! }),
        ...(query.to && { lte: toDate(query.to)! }),
      },
    }),
    ...(query.q && {
      OR: ['title', 'notes', 'provider'].map((field) => ({
        [field]: { contains: query.q, mode: 'insensitive' },
      })),
    }),
  };
  const [records, total] = await Promise.all([
    prisma.medicalRecord.findMany({
      where,
      include: { pet: true },
      orderBy: [{ occurredOn: direction }, { createdAt: direction }, { id: 'asc' }],
      skip: (query.page - 1) * 20,
      take: 20,
    }),
    prisma.medicalRecord.count({ where }),
  ]);
  return { items: records.map(recordDto), total, page: query.page, pageSize: 20 };
}
function recordData(input: RecordInput) {
  return {
    ...input,
    occurredOn: toDate(input.occurredOn)!,
    followUpOn: toDate(input.followUpOn),
    followUpNote: input.followUpOn ? input.followUpNote : null,
    details: input.details as Prisma.InputJsonValue,
  };
}
export async function createRecord(petId: string, input: RecordInput) {
  if (!(await prisma.pet.findUnique({ where: { id: petId }, select: { id: true } })))
    throw missing();
  return recordDto(
    await prisma.medicalRecord.create({
      data: { ...recordData(input), petId },
      include: { pet: true },
    }),
  );
}
export async function updateRecord(petId: string, id: string, input: RecordInput) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.medicalRecord.findFirst({ where: { id, petId } });
    if (!existing) throw missing();
    if (existing.type !== input.type)
      throw new AppError(422, 'IMMUTABLE_TYPE', 'A saved record’s type cannot be changed.');
    const clearCompletion = !input.followUpOn || input.followUpOn !== dateOnly(existing.followUpOn);
    const saved = await tx.medicalRecord.update({
      where: { id, petId },
      data: { ...recordData(input), ...(clearCompletion && { followUpCompletedAt: null }) },
      include: { pet: true },
    });
    return recordDto(saved);
  });
}
export async function deleteRecord(petId: string, id: string) {
  await prisma.medicalRecord.delete({ where: { id, petId } });
}
export async function setFollowUpCompleted(petId: string, id: string, completed: boolean) {
  // Conditional write makes repeated completion requests preserve the first timestamp.
  await prisma.medicalRecord.updateMany({
    where: {
      id,
      petId,
      followUpOn: { not: null },
      ...(completed && { followUpCompletedAt: null }),
    },
    data: { followUpCompletedAt: completed ? new Date() : null },
  });
  const record = await getRecord(petId, id);
  if (!record.followUpOn)
    throw new AppError(422, 'NO_FOLLOW_UP', 'This record does not have a follow-up.');
  return record;
}
