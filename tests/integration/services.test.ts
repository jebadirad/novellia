import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { prisma, pool } from '../../src/server/database';
import { createPet, deletePet, listPets, updatePet } from '../../src/server/pets';
import {
  createRecord,
  deleteRecord,
  getRecord,
  listRecords,
  setFollowUpCompleted,
  updateRecord,
} from '../../src/server/records';
import { getDashboard, getFollowUps } from '../../src/server/overview';
import { petInputSchema, recordInputSchema } from '../../src/domain/schemas';
import { today } from '../../src/server/context';
import { addDays } from '../../src/domain/dates';
import { seedDemo } from '../../prisma/seed-data';
const day = today();
beforeAll(async () => {
  if (!new URL(process.env.DATABASE_URL!).pathname.endsWith('/novellia_test'))
    throw new Error('Integration tests require the dedicated novellia_test database.');
  await prisma.pet.deleteMany();
});
afterAll(async () => {
  await prisma.pet.deleteMany();
  await prisma.$disconnect();
  await pool.end();
});
describe('database workflows', () => {
  it('supports duplicate pet names, updates, searches, records, follow-ups, and cascade isolation', async () => {
    const input = petInputSchema(day).parse({ name: 'Luna', species: 'dog', breed: 'Labrador' });
    const a = await createPet(input);
    const b = await createPet(input);
    expect((await listPets({ q: 'LAB', page: 1 })).total).toBe(2);
    expect((await updatePet(a.id, { ...input, name: 'Luna Moon' })).name).toBe('Luna Moon');
    const recordInput = recordInputSchema(day).parse({
      type: 'vaccination',
      title: 'Rabies booster',
      occurredOn: day,
      details: { vaccineName: 'Rabies' },
      followUpOn: addDays(day, 1),
      followUpNote: 'Call clinic',
    });
    const r = await createRecord(a.id, recordInput);
    const other = await createRecord(b.id, recordInput);
    await expect(getRecord(b.id, r.id)).rejects.toMatchObject({ status: 404 });
    expect(
      (
        await listRecords({
          q: 'RABIES',
          page: 1,
          petId: a.id,
          type: 'vaccination',
          from: day,
          to: day,
          sort: 'newest',
        })
      ).total,
    ).toBe(1);
    const completed = await setFollowUpCompleted(a.id, r.id, true);
    expect((await setFollowUpCompleted(a.id, r.id, true)).followUpCompletedAt).toBe(
      completed.followUpCompletedAt,
    );
    expect(
      (await updateRecord(a.id, r.id, { ...recordInput, title: 'Updated vaccine' }))
        .followUpCompletedAt,
    ).toBe(completed.followUpCompletedAt);
    expect(
      (await updateRecord(a.id, r.id, { ...recordInput, followUpOn: addDays(day, 2) }))
        .followUpCompletedAt,
    ).toBeNull();
    await setFollowUpCompleted(a.id, r.id, true);
    expect((await setFollowUpCompleted(a.id, r.id, false)).followUpCompletedAt).toBeNull();
    const cleared = await updateRecord(a.id, r.id, { ...recordInput, followUpOn: null });
    expect(cleared.followUpNote).toBeNull();
    expect((await getFollowUps({ tab: 'open' })).length).toBe(1);
    await deletePet(a.id);
    await expect(getRecord(a.id, r.id)).rejects.toMatchObject({ status: 404 });
    expect((await getRecord(b.id, other.id)).title).toBe('Rabies booster');
    await deleteRecord(b.id, other.id);
    await deletePet(b.id);
  });
  it('paginates deterministically and keeps dashboard counts consistent', async () => {
    await seedDemo(prisma, day);
    const first = await getDashboard();
    expect(first.petCount).toBe(4);
    expect(first.overdueCount).toBe(1);
    expect(first.dueCount).toBe(3);
    await seedDemo(prisma, day);
    expect(await prisma.medicalRecord.count()).toBe(12);
    await prisma.pet.update({
      where: { id: '10000000-0000-4000-8000-000000000001' },
      data: { name: 'Edited Luna' },
    });
    await seedDemo(prisma, day);
    expect(
      (
        await prisma.pet.findUniqueOrThrow({
          where: { id: '10000000-0000-4000-8000-000000000001' },
        })
      ).name,
    ).toBe('Edited Luna');
    for (let i = 0; i < 22; i++)
      await createPet(
        petInputSchema(day).parse({ name: `Test ${String(i).padStart(2, '0')}`, species: 'cat' }),
      );
    const one = await listPets({ q: 'Test', page: 1 });
    const two = await listPets({ q: 'Test', page: 2 });
    expect(one.items).toHaveLength(20);
    expect(two.items).toHaveLength(2);
    expect(new Set([...one.items, ...two.items].map((p) => p.id)).size).toBe(22);
  });
});
