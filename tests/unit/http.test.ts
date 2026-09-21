import { afterEach, expect, it, vi } from 'vitest';
import { handle } from '../../src/server/http';
import { AppError } from '../../src/server/errors';
import { recordInputSchema } from '../../src/domain/schemas';
afterEach(() => vi.restoreAllMocks());
it('returns nested field errors without flattening away the detail field path', async () => {
  const response = await handle(async () =>
    recordInputSchema('2026-09-20').parse({
      type: 'vaccination',
      title: 'Vaccine',
      occurredOn: '2026-09-20',
      details: { vaccineName: '' },
    }),
  );
  expect(response.status).toBe(422);
  expect(await response.json()).toMatchObject({
    error: {
      code: 'VALIDATION_ERROR',
      fieldErrors: { 'details.vaccineName': ['Enter a vaccine name.'] },
    },
  });
});
it('keeps unexpected internal errors out of the response', async () => {
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  const response = await handle(async () => {
    throw new Error('private database details');
  });
  expect(response.status).toBe(500);
  expect(await response.text()).not.toContain('private database');
  expect(log).toHaveBeenCalledOnce();
});
it.each(['P2025', 'P2003'])(
  'maps deleted or missing related data (%s) to a useful 404',
  async (code) => {
    const response = await handle(async () => {
      throw { code };
    });
    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ error: { code: 'NOT_FOUND' } });
  },
);
it('preserves actionable application field errors', async () => {
  const response = await handle(async () => {
    throw new AppError(422, 'UNRESOLVED_LOCATION', 'Update the clinic address.', {
      followUpProviderId: ['Resolve this address first.'],
    });
  });
  expect(response.status).toBe(422);
  expect(await response.json()).toMatchObject({
    error: {
      code: 'UNRESOLVED_LOCATION',
      fieldErrors: { followUpProviderId: ['Resolve this address first.'] },
    },
  });
});
