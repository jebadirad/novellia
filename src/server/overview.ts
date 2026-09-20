import 'server-only';
import { prisma } from './database';
import { today } from './context';
import { addDays, toDate } from '@/domain/dates';
import { recordDto } from './serialize';
import { listPets } from './pets';
import type { FollowUpQuery } from '@/domain/schemas';

export async function getDashboard() {
  const day = today();
  const open = { followUpCompletedAt: null, followUpOn: { not: null } };
  const [petCount, overdueCount, dueCount, attention, pets, recent] = await Promise.all([
    prisma.pet.count(),
    prisma.medicalRecord.count({ where: { ...open, followUpOn: { lt: toDate(day)! } } }),
    prisma.medicalRecord.count({
      where: { ...open, followUpOn: { gte: toDate(day)!, lte: toDate(addDays(day, 30))! } },
    }),
    prisma.medicalRecord.findMany({
      where: { ...open, followUpOn: { lte: toDate(addDays(day, 30))! } },
      orderBy: [{ followUpOn: 'asc' }, { id: 'asc' }],
      take: 5,
      include: { pet: true, provider: true },
    }),
    listPets({ q: '', page: 1 }),
    prisma.medicalRecord.findMany({
      orderBy: [{ occurredOn: 'desc' }, { createdAt: 'desc' }, { id: 'asc' }],
      take: 5,
      include: { pet: true, provider: true },
    }),
  ]);
  return {
    petCount,
    overdueCount,
    dueCount,
    attention: attention.map(recordDto),
    pets: pets.items.slice(0, 6),
    recent: recent.map(recordDto),
  };
}
export async function getFollowUps(query: FollowUpQuery) {
  const day = today();
  const records = await prisma.medicalRecord.findMany({
    where: {
      ...(query.petId && { petId: query.petId }),
      followUpOn:
        query.group === 'overdue'
          ? { lt: toDate(day)! }
          : query.group === 'due'
            ? { gte: toDate(day)!, lte: toDate(addDays(day, 30))! }
            : { not: null },
      followUpCompletedAt: query.tab === 'completed' ? { not: null } : null,
    },
    include: { pet: true, provider: true },
    orderBy:
      query.tab === 'completed'
        ? [{ followUpCompletedAt: 'desc' }, { id: 'asc' }]
        : [{ followUpOn: 'asc' }, { id: 'asc' }],
  });
  return records.map(recordDto);
}
