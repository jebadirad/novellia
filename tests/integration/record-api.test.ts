import { beforeAll, afterAll, beforeEach, expect, it, vi } from 'vitest';
import { prisma, pool } from '../../src/server/database';
import { testDatabaseLifecycle } from '../database-lifecycle';
import { createPet } from '../../src/server/pets';
import { createProvider } from '../../src/server/providers';
import { petInputSchema } from '../../src/domain/schemas';
import { providerSchema } from '../../src/domain/providers';
import { today } from '../../src/server/context';
import { addDays } from '../../src/domain/dates';
import { getDashboard, getFollowUps } from '../../src/server/overview';
import * as collection from '../../src/app/api/pets/[petId]/records/route';
import * as item from '../../src/app/api/pets/[petId]/records/[recordId]/route';
import { PATCH as complete } from '../../src/app/api/pets/[petId]/records/[recordId]/follow-up/route';
vi.mock('../../src/server/address-search', () => ({ searchAddresses: async () => [] }));
const database = testDatabaseLifecycle(prisma, pool, process.env.DATABASE_URL);
beforeAll(database.setup);
beforeEach(database.setup);
afterAll(database.cleanup);
const day = today();
const request = (method: string, body?: unknown, query = '') =>
  new Request(`http://localhost/api/records${query}`, {
    method,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
const context = (petId: string, recordId = '') => ({
  params: Promise.resolve({ petId, recordId }),
});
const pet = () => createPet(petInputSchema(day).parse({ name: 'API fixture', species: 'dog' }));
const base = { title: 'Visit', type: 'vet_visit', occurredOn: day, details: { reason: 'Checkup' } };

it.each([
  ['vet_visit', { reason: 'Checkup', assessment: 'Normal' }, { assessment: null }],
  ['vaccination', { vaccineName: 'Rabies', lotNumber: 'Batch' }, { lotNumber: null }],
  [
    'medication',
    { medicationName: 'Example', dose: 'Small dose', frequency: 'Daily' },
    { dose: null },
  ],
])('supports the full HTTP lifecycle for %s', async (type, details, change) => {
  const owner = await pet();
  const created = await collection.POST(
    request('POST', { ...base, type, details }),
    context(owner.id),
  );
  expect(created.status).toBe(201);
  const record = await created.json();
  const ctx = context(owner.id, record.id);
  expect((await item.GET(request('GET'), ctx)).status).toBe(200);
  const edited = await item.PATCH(request('PATCH', { details: change }), ctx);
  expect(edited.status).toBe(200);
  expect((await edited.json()).details).toMatchObject({ ...details, ...change });
  expect((await complete(request('PATCH', { completed: true }), ctx)).status).toBe(422);
  const deleted = await item.DELETE(request('DELETE'), ctx);
  expect(deleted.status).toBe(204);
  expect(await deleted.text()).toBe('');
  expect((await item.GET(request('GET'), ctx)).status).toBe(404);
  expect((await item.PATCH(request('PATCH', { title: 'Missing' }), ctx)).status).toBe(404);
  expect((await item.DELETE(request('DELETE'), ctx)).status).toBe(404);
});

it('enforces parent scope for reads, edits, deletion, completion, and scoped search', async () => {
  const a = await pet();
  const b = await pet();
  const clinic = await createProvider(providerSchema.parse({ name: 'Scope clinic' }));
  const saved = await (
    await collection.POST(
      request('POST', { ...base, followUpOn: day, followUpProviderId: clinic.id }),
      context(a.id),
    )
  ).json();
  const wrong = context(b.id, saved.id);
  for (const response of [
    await item.GET(request('GET'), wrong),
    await item.PATCH(request('PATCH', { title: 'Wrong pet' }), wrong),
    await item.DELETE(request('DELETE'), wrong),
    await complete(request('PATCH', { completed: true }), wrong),
  ]) {
    expect(response.status).toBe(404);
  }
  const scoped = await collection.GET(request('GET', undefined, `?petId=${a.id}`), context(b.id));
  expect(await scoped.json()).toMatchObject({ total: 0, items: [] });
  const unchanged = await (await item.GET(request('GET'), context(a.id, saved.id))).json();
  expect(unchanged).toMatchObject({ title: 'Visit', followUpCompletedAt: null });
});

it('returns field paths for validation, rejects malformed JSON, and never persists invalid writes', async () => {
  const owner = await pet();
  for (const body of [null, [], 'string']) {
    expect((await collection.POST(request('POST', body), context(owner.id))).status).toBe(400);
  }
  expect(
    (
      await collection.POST(
        new Request('http://localhost/api', { method: 'POST', body: '{' }),
        context(owner.id),
      )
    ).status,
  ).toBe(400);
  const invalid = await collection.POST(
    request('POST', { ...base, details: { reason: '' } }),
    context(owner.id),
  );
  expect(invalid.status).toBe(422);
  expect(await invalid.json()).toMatchObject({
    error: { code: 'VALIDATION_ERROR', fieldErrors: { 'details.reason': expect.any(Array) } },
  });
  for (const query of [
    '?page=0',
    '?type=unknown',
    '?from=2026-09-20&to=2026-09-01',
    '?petId=invalid&type=unknown',
  ]) {
    expect((await collection.GET(request('GET', undefined, query), context(owner.id))).status).toBe(
      400,
    );
  }
  expect(await prisma.medicalRecord.count()).toBe(0);
});

it('combines search filters and paginates tied record dates without duplicates or gaps', async () => {
  const owner = await pet();
  const clinic = await createProvider(providerSchema.parse({ name: 'Search clinic' }));
  for (let i = 0; i < 23; i++) {
    const response = await collection.POST(
      request('POST', {
        ...base,
        title: `Match ${i}`,
        providerId: clinic.id,
        notes: 'SEARCHABLE NOTES',
      }),
      context(owner.id),
    );
    expect(response.status).toBe(201);
  }
  const query = `?q=searchable&type=vet_visit&providerId=${clinic.id}&from=${day}&to=${day}&sort=oldest`;
  const list = async (suffix: string) =>
    (await collection.GET(request('GET', undefined, suffix), context(owner.id))).json();
  const first = await list(query);
  const second = await list(`${query}&page=2`);
  expect(first.total).toBe(23);
  expect(first.items).toHaveLength(20);
  expect(second.items).toHaveLength(3);
  const ids = [...first.items, ...second.items].map((record: { id: string }) => record.id);
  expect(new Set(ids).size).toBe(23);
  const again = await list(query);
  expect(again.items).toEqual(first.items);
  expect((await list(query.replace('vet_visit', 'medication'))).total).toBe(0);
  expect((await list(query.replace('searchable', 'Checkup'))).total).toBe(0); // JSON details are intentionally not searched.
  expect((await list(`${query}&page=3`)).items).toEqual([]);
});

it('keeps dashboard and follow-up lists consistent through completion, reopening, removal, and deletion', async () => {
  const owner = await pet();
  const clinic = await createProvider(providerSchema.parse({ name: 'Dashboard clinic' }));
  const created = await collection.POST(
    request('POST', {
      ...base,
      occurredOn: addDays(day, -2),
      followUpOn: addDays(day, -1),
      followUpProviderId: clinic.id,
    }),
    context(owner.id),
  );
  const record = await created.json();
  const ctx = context(owner.id, record.id);
  expect(await getDashboard()).toMatchObject({ overdueCount: 1, dueCount: 0 });
  const first = await (await complete(request('PATCH', { completed: true }), ctx)).json();
  const repeated = await (await complete(request('PATCH', { completed: true }), ctx)).json();
  expect(repeated.followUpCompletedAt).toBe(first.followUpCompletedAt);
  expect(await getDashboard()).toMatchObject({ overdueCount: 0, dueCount: 0 });
  expect(await getFollowUps({ tab: 'completed', petId: owner.id })).toHaveLength(1);
  for (let i = 0; i < 2; i++) {
    expect((await complete(request('PATCH', { completed: false }), ctx)).status).toBe(200);
  }
  expect(await getDashboard()).toMatchObject({ overdueCount: 1 });
  await item.PATCH(request('PATCH', { followUpOn: day }), ctx);
  expect(await getDashboard()).toMatchObject({ overdueCount: 0, dueCount: 1 });
  await item.PATCH(request('PATCH', { followUpOn: null }), ctx);
  expect(await getFollowUps({ tab: 'open' })).toHaveLength(0);
  expect(await getDashboard()).toMatchObject({ dueCount: 0 });
  await item.PATCH(request('PATCH', { followUpOn: day, followUpProviderId: clinic.id }), ctx);
  await item.DELETE(request('DELETE'), ctx);
  expect(await getDashboard()).toMatchObject({ overdueCount: 0, dueCount: 0, recent: [] });
});
