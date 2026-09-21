import { describe, expect, it } from 'vitest';
import { mergeRecordPatch } from '../../src/domain/record-patch';
import { recordInputSchema } from '../../src/domain/schemas';
const day = '2026-09-20';
const records = [
  {
    type: 'vet_visit',
    details: { reason: 'Visit', assessment: 'Normal' },
    required: 'reason',
    optional: 'assessment',
  },
  {
    type: 'vaccination',
    details: { vaccineName: 'Rabies', lotNumber: 'Lot 1' },
    required: 'vaccineName',
    optional: 'lotNumber',
  },
  {
    type: 'medication',
    details: {
      medicationName: 'Example',
      dose: 'One tablet',
      frequency: 'Daily',
      endDate: '2026-09-30',
    },
    required: 'medicationName',
    optional: 'dose',
  },
];
describe.each(records)('$type PATCH contract', ({ type, details, required, optional }) => {
  const existing = recordInputSchema(day).parse({
    type,
    details,
    title: 'Original',
    occurredOn: day,
    notes: 'Keep notes',
  });
  it('preserves omitted values, merges details, and leaves the original input untouched', () => {
    const before = structuredClone(existing);
    const saved = mergeRecordPatch(existing, { details: { [optional]: null } }, day);
    expect(saved).toEqual({ ...existing, details: { ...existing.details, [optional]: null } });
    expect(existing).toEqual(before);
    expect(mergeRecordPatch(existing, {}, day)).toEqual(existing);
  });
  it.each([null, '', '   ', undefined])('rejects clearing required details with %s', (value) => {
    expect(() => mergeRecordPatch(existing, { details: { [required]: value } }, day)).toThrow();
  });
  it.each([null, [], 'invalid', { unknown: 'field' }])('rejects invalid details: %j', (details) => {
    expect(() => mergeRecordPatch(existing, { details }, day)).toThrow();
  });
});
it('validates dates against the merged record, not just the supplied fields', () => {
  const existing = recordInputSchema(day).parse({
    type: 'medication',
    title: 'Medication',
    occurredOn: '2026-09-01',
    details: { medicationName: 'Example', endDate: '2026-09-10' },
  });
  expect(() => mergeRecordPatch(existing, { occurredOn: day }, day)).toThrow();
  expect(
    mergeRecordPatch(existing, { occurredOn: day, details: { endDate: null } }, day).occurredOn,
  ).toBe(day);
});
it('rejects managed fields and malformed schedule values', () => {
  const existing = recordInputSchema(day).parse({
    type: 'vet_visit',
    title: 'Visit',
    occurredOn: day,
    details: { reason: 'Check' },
  });
  for (const patch of [
    { detailsVersion: 9 },
    { followUpAt: null },
    { followUpTimeZone: 'UTC' },
    { updatedAt: null },
    { followUpTime: '25:00' },
    { followUpTime: '09:00' },
    { followUpOn: '2026-02-30' },
  ]) {
    expect(() => mergeRecordPatch(existing, patch, day)).toThrow();
  }
});
