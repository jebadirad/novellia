import { describe, expect, it } from 'vitest';
import { normalizeProviderName, providerSchema } from '../../src/domain/providers';
import { recordInputSchema } from '../../src/domain/schemas';

describe('provider validation', () => {
  it('normalizes names without conflating distinct locations', () => {
    expect(normalizeProviderName('  Green   Valley\tVET ')).toBe('green valley vet');
    expect(normalizeProviderName('Green Valley North')).not.toBe(
      normalizeProviderName('Green Valley South'),
    );
    expect(providerSchema.parse({ name: ' Green   Valley ', phone: '' })).toMatchObject({
      name: 'Green Valley',
      kind: 'clinic',
      phone: null,
    });
  });
  it('rejects blank names, invalid kinds, oversized fields, and managed fields', () => {
    for (const input of [
      { name: ' ' },
      { kind: 'hospital' },
      { phone: 'x'.repeat(81) },
      { archivedAt: new Date().toISOString() },
      { normalizedName: 'injected' },
    ]) {
      expect(providerSchema.safeParse({ name: 'Clinic', ...input }).success).toBe(false);
    }
  });
  it('accepts optional provider links but rejects free text and malformed IDs', () => {
    const base = {
      type: 'vet_visit',
      title: 'Checkup',
      occurredOn: '2026-09-20',
      details: { reason: 'Annual' },
    };
    const schema = recordInputSchema('2026-09-20');
    expect(schema.parse(base).providerId).toBeNull();
    expect(schema.safeParse({ ...base, providerId: 'Clinic' }).success).toBe(false);
    expect(schema.safeParse({ ...base, provider: 'Free text' }).success).toBe(false);
  });
});
