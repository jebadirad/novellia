import { z } from 'zod';
import { recordInputSchema } from './schemas';

/** PATCH merges supplied detail fields; null clears optional values, omission preserves them. */
export function mergeRecordPatch(
  existing: Record<string, unknown>,
  patch: Record<string, unknown>,
  today: string,
) {
  const issues: z.core.$ZodIssue[] = [];
  function check(values: Record<string, unknown>, prefix: string[] = []) {
    for (const [key, value] of Object.entries(values)) {
      if (value === undefined || (typeof value === 'string' && !value.trim())) {
        issues.push({
          code: 'custom',
          path: [...prefix, key],
          message: 'Send null to clear an optional value, or omit it to keep the current value.',
        });
      }
    }
  }
  check(patch);
  const details = patch.details;
  const detailPatch = details !== null && typeof details === 'object' && !Array.isArray(details);
  if (detailPatch) {
    check(details as Record<string, unknown>, ['details']);
  }
  const merged: Record<string, unknown> = {
    ...existing,
    ...patch,
    ...(detailPatch ? { details: { ...(existing.details as object), ...details } } : {}),
  };
  if (patch.followUpOn === null) {
    for (const key of ['followUpNote', 'followUpProviderId', 'followUpTime']) {
      if (patch[key] !== undefined && patch[key] !== null) {
        issues.push({
          code: 'custom',
          path: [key],
          message: 'Cannot supply follow-up values when removing the follow-up.',
        });
      }
      merged[key] = null;
    }
  }
  if (!merged.followUpOn) {
    for (const key of ['followUpNote', 'followUpProviderId', 'followUpTime']) {
      if (merged[key] != null) {
        issues.push({
          code: 'custom',
          path: [key],
          message: 'Add a follow-up date before setting follow-up values.',
        });
      }
    }
  }
  if (issues.length) {
    throw new z.ZodError(issues);
  }
  return recordInputSchema(today).parse(merged);
}
