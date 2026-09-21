import { beforeAll, afterAll, describe, expect, it, vi } from 'vitest';
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
import {
  createProvider,
  updateProvider,
  archiveProvider,
  deleteProvider,
  listProviders,
} from '../../src/server/providers';
import { providerSchema } from '../../src/domain/providers';
import { testDatabaseLifecycle } from '../database-lifecycle';
vi.mock('../../src/server/address-search', () => ({ searchAddresses: async () => [] }));
const day = today();
const database = testDatabaseLifecycle(prisma, pool, process.env.DATABASE_URL);
beforeAll(database.setup);
afterAll(database.cleanup);
describe('database workflows', () => {
  it('reuses providers, protects history, and rejects unavailable links', async () => {
    const providerInput = providerSchema.parse({
      name: '  Test   Clinic ',
      kind: 'clinic',
      phone: '(480) 555-0100',
      addressLine1: '100 Example Street',
      addressLine2: 'Suite 2',
      city: 'Phoenix',
      state: 'az',
      zip: '850011234',
    });
    const provider = await createProvider(providerInput);
    expect(provider).toMatchObject({
      phone: '(480) 555-0100',
      addressLine1: '100 Example Street',
      addressLine2: 'Suite 2',
      city: 'Phoenix',
      state: 'AZ',
      zip: '85001-1234',
    });
    const duplicates = await Promise.allSettled([
      createProvider(providerSchema.parse({ name: 'TEST CLINIC' })),
      createProvider(providerSchema.parse({ name: 'test  clinic' })),
    ]);
    expect(duplicates.every((result) => result.status === 'rejected')).toBe(true);
    const pet = await createPet(
      petInputSchema(day).parse({ name: 'Provider test', species: 'cat' }),
    );
    const input = recordInputSchema(day).parse({
      type: 'vet_visit',
      title: 'Checkup',
      occurredOn: day,
      providerId: provider.id,
      details: { reason: 'Annual' },
    });
    const record = await createRecord(pet.id, input);
    expect(record.provider?.name).toBe('Test Clinic');
    await expect(deleteProvider(provider.id)).rejects.toMatchObject({
      status: 409,
      code: 'PROVIDER_IN_USE',
    });
    // Database protection still applies to callers bypassing the service.
    await expect(prisma.careProvider.delete({ where: { id: provider.id } })).rejects.toMatchObject({
      code: 'P2003',
    });
    await updateProvider(provider.id, { ...providerInput, name: 'Renamed Clinic' });
    expect((await getRecord(pet.id, record.id)).provider?.name).toBe('Renamed Clinic');
    expect(
      (await listRecords({ q: 'RENAMED', page: 1, sort: 'newest' })).items.map((r) => r.id),
    ).toContain(record.id);
    expect(
      (await listRecords({ q: '', page: 1, sort: 'newest', providerId: provider.id })).total,
    ).toBe(1);
    const archived = await archiveProvider(provider.id, true);
    expect((await archiveProvider(provider.id, true)).archivedAt).toBe(archived.archivedAt);
    expect(
      (await listProviders({ q: '', status: 'active' })).some((p) => p.id === provider.id),
    ).toBe(false);
    expect(
      (await listProviders({ q: '', status: 'archived' })).some((p) => p.id === provider.id),
    ).toBe(true);
    expect((await getRecord(pet.id, record.id)).provider?.archivedAt).toBeTruthy();
    await expect(createRecord(pet.id, input)).rejects.toMatchObject({ status: 422 });
    const edited = await updateRecord(pet.id, record.id, { ...input, title: 'Updated checkup' });
    expect(edited.providerId).toBe(provider.id);
    await updateRecord(pet.id, record.id, { ...input, providerId: null });
    await expect(updateRecord(pet.id, record.id, input)).rejects.toMatchObject({ status: 422 });
    await expect(
      createRecord(pet.id, { ...input, providerId: '00000000-0000-4000-8000-000000000000' }),
    ).rejects.toMatchObject({ status: 422 });
    await archiveProvider(provider.id, false);
    await updateRecord(pet.id, record.id, input);
    await deletePet(pet.id);
    await deleteProvider(provider.id);
    expect((await listProviders({ q: 'Renamed', status: 'all' })).length).toBe(0);
  });
  it('supports duplicate pet names, updates, searches, records, follow-ups, and cascade isolation', async () => {
    const input = petInputSchema(day).parse({ name: 'Luna', species: 'dog', breed: 'Labrador' });
    const a = await createPet(input);
    const b = await createPet(input);
    expect((await listPets({ q: 'LAB', page: 1 })).total).toBe(2);
    expect((await updatePet(a.id, { ...input, name: 'Luna Moon' })).name).toBe('Luna Moon');
    const followUpProvider = await createProvider(
      providerSchema.parse({ name: 'Follow-up clinic' }),
    );
    const recordInput = recordInputSchema(day).parse({
      type: 'vaccination',
      title: 'Rabies booster',
      occurredOn: day,
      details: { vaccineName: 'Rabies' },
      followUpOn: addDays(day, 1),
      followUpNote: 'Call clinic',
      followUpProviderId: followUpProvider.id,
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
    await deleteProvider(followUpProvider.id);
  });
  it('persists clinic appointments, protects provider links, and preserves schedule snapshots', async () => {
    const pet = await createPet(
      petInputSchema(day).parse({ name: 'Appointment pet', species: 'cat' }),
    );
    const clinic = await createProvider(
      providerSchema.parse({ name: 'California referral clinic' }),
    );
    await prisma.careProvider.update({
      where: { id: clinic.id },
      data: {
        timeZone: 'America/Los_Angeles',
        addressLine1: '100 Example Street',
        city: 'El Centro',
        state: 'CA',
        zip: '92243',
      },
    });
    const input = recordInputSchema(day).parse({
      type: 'vet_visit',
      title: 'Referral',
      occurredOn: day,
      details: { reason: 'Recheck' },
      followUpOn: '2027-01-15',
      followUpTime: '09:00',
      followUpProviderId: clinic.id,
    });
    const record = await createRecord(pet.id, input);
    expect(record).toMatchObject({
      providerId: null,
      followUpAt: '2027-01-15T17:00:00.000Z',
      followUpTimeZone: 'America/Los_Angeles',
      followUpTime: '09:00',
    });
    await expect(deleteProvider(clinic.id)).rejects.toMatchObject({ status: 409 });
    const complete = await setFollowUpCompleted(pet.id, record.id, true);
    // A clinic relocation must not silently reschedule a booked appointment.
    await prisma.careProvider.update({
      where: { id: clinic.id },
      data: { timeZone: 'America/Phoenix' },
    });
    const unchanged = await updateRecord(pet.id, record.id, { ...input, notes: 'Unrelated edit' });
    expect(unchanged.followUpAt).toBe(record.followUpAt);
    expect(unchanged.followUpCompletedAt).toBe(complete.followUpCompletedAt);
    const moved = await updateRecord(pet.id, record.id, { ...input, followUpTime: '10:30' });
    expect(moved.followUpCompletedAt).toBeNull();
    expect(moved.followUpAt).toBe('2027-01-15T17:30:00.000Z');
    await prisma.careProvider.update({
      where: { id: clinic.id },
      data: {
        timeZone: 'America/Los_Angeles',
        addressLine1: '100 Example Street',
        city: 'El Centro',
        state: 'CA',
        zip: '92243',
      },
    });
    await expect(
      createRecord(pet.id, { ...input, followUpOn: '2027-03-14', followUpTime: '02:30' }),
    ).rejects.toMatchObject({ status: 422, code: 'AMBIGUOUS_APPOINTMENT' });
    await archiveProvider(clinic.id, true);
    await expect(createRecord(pet.id, input)).rejects.toMatchObject({ status: 422 });
    await archiveProvider(clinic.id, false);
    await updateProvider(clinic.id, providerSchema.parse({ name: clinic.name }));
    await expect(createRecord(pet.id, input)).rejects.toMatchObject({
      code: 'UNRESOLVED_LOCATION',
    });
    await expect(
      createRecord(pet.id, { ...input, followUpTime: null, followUpProviderId: null }),
    ).rejects.toMatchObject({ code: 'FOLLOW_UP_PROVIDER_REQUIRED' });
    const cleared = await updateRecord(pet.id, record.id, {
      ...input,
      followUpOn: null,
      followUpTime: null,
    });
    expect(cleared).toMatchObject({
      followUpAt: null,
      followUpTimeZone: null,
      followUpProviderId: null,
      followUpCompletedAt: null,
    });
    await deletePet(pet.id);
    await deleteProvider(clinic.id);
  });
  it('paginates deterministically and keeps dashboard counts consistent', async () => {
    await seedDemo(prisma, day);
    const first = await getDashboard();
    expect(first.petCount).toBe(4);
    expect(first.overdueCount).toBe(1);
    expect(first.dueCount).toBe(3);
    await seedDemo(prisma, day);
    expect(await prisma.medicalRecord.count()).toBe(12);
    const seededProvider = (await listProviders({ q: 'Green Valley', status: 'active' }))[0];
    await updateProvider(
      seededProvider.id,
      providerSchema.parse({
        ...providerSchema.parse({ name: 'Edited seed clinic' }),
        kind: seededProvider.kind,
      }),
    );
    await seedDemo(prisma, day);
    expect(await prisma.careProvider.count()).toBe(2);
    expect((await listProviders({ q: 'Edited seed', status: 'active' }))[0].id).toBe(
      seededProvider.id,
    );
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
    for (let i = 0; i < 22; i++) {
      await createPet(
        petInputSchema(day).parse({ name: `Test ${String(i).padStart(2, '0')}`, species: 'cat' }),
      );
    }
    const one = await listPets({ q: 'Test', page: 1 });
    const two = await listPets({ q: 'Test', page: 2 });
    expect(one.items).toHaveLength(20);
    expect(two.items).toHaveLength(2);
    expect(new Set([...one.items, ...two.items].map((p) => p.id)).size).toBe(22);
  });
});
