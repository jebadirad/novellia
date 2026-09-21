import 'server-only';
import { followUpSortValue } from '@/domain/scheduling';
import { appTimeZone } from './context';
import { prisma } from './database';
import { recordDto } from './serialize';
import { listPets } from './pets';
import type { FollowUpQuery } from '@/domain/schemas';

export async function getDashboard() {
  const [petCount, followUps, pets, recent] = await Promise.all([
    prisma.pet.count(),
    getFollowUps({ tab: 'open' }),
    listPets({ q: '', page: 1 }),
    prisma.medicalRecord.findMany({
      orderBy: [{ occurredOn: 'desc' }, { createdAt: 'desc' }, { id: 'asc' }],
      take: 5,
      include: { pet: true, provider: true, followUpProvider: true },
    }),
  ]);
  return {
    petCount,
    overdueCount: followUps.filter((r) => r.followUpStatus === 'overdue').length,
    dueCount: followUps.filter((r) => r.followUpStatus === 'today' || r.followUpStatus === 'soon')
      .length,
    attention: followUps.filter((r) => r.followUpStatus !== 'later').slice(0, 5),
    pets: pets.items.slice(0, 6),
    recent: recent.map(recordDto),
  };
}
export async function getFollowUps(query: FollowUpQuery) {
  const records = await prisma.medicalRecord.findMany({
    where: {
      ...(query.petId && { petId: query.petId }),
      followUpOn: { not: null },
      followUpCompletedAt: query.tab === 'completed' ? { not: null } : null,
    },
    include: { pet: true, provider: true, followUpProvider: true },
    orderBy:
      query.tab === 'completed'
        ? [{ followUpCompletedAt: 'desc' }, { id: 'asc' }]
        : [{ followUpOn: 'asc' }, { followUpAt: 'asc' }, { id: 'asc' }],
  });
  return records
    .map(recordDto)
    .sort((a, b) =>
      query.tab === 'completed'
        ? 0
        : followUpSortValue(a, appTimeZone) - followUpSortValue(b, appTimeZone) ||
          a.id.localeCompare(b.id),
    )
    .filter(
      (record) =>
        !query.group ||
        (query.group === 'overdue'
          ? record.followUpStatus === 'overdue'
          : record.followUpStatus === 'today' || record.followUpStatus === 'soon'),
    );
}
