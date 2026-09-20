import { describe, expect, it } from 'vitest';
import { addDays, todayIn, followUpGroup, petAge, formatDate } from '../../src/domain/dates';
import { petInputSchema, recordInputSchema, recordQuerySchema } from '../../src/domain/schemas';
const day = '2026-09-18';
const base = {
  title: 'Annual visit',
  occurredOn: day,
  type: 'vet_visit',
  details: { reason: 'Checkup' },
};
describe('calendar dates', () => {
  it('uses the configured timezone across midnight', () =>
    expect(todayIn('America/Phoenix', new Date('2026-09-19T02:00:00Z'))).toBe(day));
  it('handles leap days and month boundaries', () => {
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(addDays('2024-02-29', 1)).toBe('2024-03-01');
  });
  it('classifies boundaries and completion', () => {
    expect(followUpGroup('2026-09-17', null, day)).toBe('overdue');
    expect(followUpGroup(day, null, day)).toBe('today');
    expect(followUpGroup(addDays(day, 30), null, day)).toBe('soon');
    expect(followUpGroup(addDays(day, 31), null, day)).toBe('later');
    expect(followUpGroup(day, '2026-09-18T12:00:00Z', day)).toBe('completed');
  });
  it('does not shift calendar dates when displaying', () =>
    expect(formatDate('2026-01-01')).toBe('January 1, 2026'));
  it('handles unknown ages and birthdays', () => {
    expect(petAge(null, day)).toBe('Age unknown');
    expect(petAge('2024-09-19', day)).toBe('1 year old');
    expect(petAge('2026-08-18', day)).toBe('1 month old');
  });
});
describe('input validation', () => {
  it('trims required fields and normalizes optional values', () =>
    expect(petInputSchema(day).parse({ name: ' Luna ', species: 'dog', breed: '' })).toMatchObject({
      name: 'Luna',
      sex: 'unknown',
      breed: null,
      birthDate: null,
    }));
  it('rejects blank names, future birthdays, impossible dates, and server fields', () => {
    for (const fields of [
      { name: ' ' },
      { birthDate: '2026-09-19' },
      { birthDate: '2025-02-29' },
      { id: 'injected' },
    ]) {
      expect(
        petInputSchema(day).safeParse({ name: 'Luna', species: 'dog', ...fields }).success,
      ).toBe(false);
    }
  });
  it('requires the correct type-specific fields', () => {
    expect(recordInputSchema(day).safeParse(base).success).toBe(true);
    expect(recordInputSchema(day).safeParse({ ...base, type: 'vaccination' }).success).toBe(false);
    expect(recordInputSchema(day).safeParse({ ...base, type: 'unknown' }).success).toBe(false);
    expect(
      recordInputSchema(day).safeParse({ ...base, details: { reason: 'Checkup', injected: true } })
        .success,
    ).toBe(false);
  });
  it('rejects future records and earlier follow-ups', () => {
    expect(recordInputSchema(day).safeParse({ ...base, occurredOn: '2026-09-19' }).success).toBe(
      false,
    );
    expect(recordInputSchema(day).safeParse({ ...base, followUpOn: '2026-09-17' }).success).toBe(
      false,
    );
  });
  it('checks medication end dates while allowing unknown dose', () => {
    const medication = { ...base, type: 'medication', details: { medicationName: 'Example' } };
    expect(recordInputSchema(day).safeParse(medication).success).toBe(true);
    expect(
      recordInputSchema(day).safeParse({
        ...medication,
        details: { medicationName: 'Example', endDate: '2026-09-17' },
      }).success,
    ).toBe(false);
  });
  it('validates queries including reversed dates and invalid page numbers', () => {
    expect(recordQuerySchema.safeParse({ from: '2026-09-18', to: '2026-09-01' }).success).toBe(
      false,
    );
    expect(recordQuerySchema.safeParse({ page: '-1' }).success).toBe(false);
    expect(recordQuerySchema.safeParse({ petId: 'oops' }).success).toBe(false);
  });
});
