import 'server-only';
import { prisma } from './database';
import { petDto, recordDto } from './serialize';
import { missing } from './errors';
import { toDate } from '@/domain/dates';
import type { PetInput, PetQuery } from '@/domain/schemas';
import type { Prisma } from '@/generated/prisma/client';
import type { PetSummary, PageResult } from '@/domain/types';

export async function getPet(id: string) {
  const pet = await prisma.pet.findUnique({
    where: { id },
    include: {
      _count: { select: { records: true } },
      records: {
        where: { followUpOn: { not: null }, followUpCompletedAt: null },
        orderBy: [{ followUpOn: 'asc' }, { id: 'asc' }],
        take: 1,
        include: { pet: true },
      },
    },
  });
  if (!pet) throw missing();
  return {
    ...petDto(pet),
    recordCount: pet._count.records,
    nextFollowUp: pet.records[0] ? recordDto(pet.records[0]) : null,
  } satisfies PetSummary;
}
export async function listPets(query: PetQuery): Promise<PageResult<PetSummary>> {
  const where: Prisma.PetWhereInput = {
    ...(query.species && { species: query.species }),
    ...(query.q && {
      OR: [
        { name: { contains: query.q, mode: 'insensitive' } },
        { breed: { contains: query.q, mode: 'insensitive' } },
      ],
    }),
  };
  const [pets, total] = await Promise.all([
    prisma.pet.findMany({
      where,
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      skip: (query.page - 1) * 20,
      take: 20,
      include: {
        _count: { select: { records: true } },
        records: {
          where: { followUpOn: { not: null }, followUpCompletedAt: null },
          orderBy: [{ followUpOn: 'asc' }, { id: 'asc' }],
          take: 1,
          include: { pet: true },
        },
      },
    }),
    prisma.pet.count({ where }),
  ]);
  return {
    items: pets.map((pet) => ({
      ...petDto(pet),
      recordCount: pet._count.records,
      nextFollowUp: pet.records[0] ? recordDto(pet.records[0]) : null,
    })),
    total,
    page: query.page,
    pageSize: 20,
  };
}
export const petOptions = () =>
  prisma.pet.findMany({
    select: { id: true, name: true, species: true },
    orderBy: [{ name: 'asc' }, { id: 'asc' }],
  });
export async function createPet(input: PetInput) {
  return petDto(
    await prisma.pet.create({ data: { ...input, birthDate: toDate(input.birthDate) } }),
  );
}
export async function updatePet(id: string, input: PetInput) {
  return petDto(
    await prisma.pet.update({
      where: { id },
      data: { ...input, birthDate: toDate(input.birthDate) },
    }),
  );
}
export async function deletePet(id: string) {
  await prisma.pet.delete({ where: { id } });
}
