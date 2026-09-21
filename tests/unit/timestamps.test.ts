import { describe, expect, it } from 'vitest';
import { formatDate, formatTimestampDate } from '../../src/domain/dates';

describe('timestamp display', () => {
  it('converts the instant before formatting its date near UTC midnight', () => {
    const instant = '2026-09-21T03:00:00.000Z';
    expect(formatTimestampDate(instant, 'America/Phoenix')).toBe('September 20, 2026');
    expect(formatTimestampDate(instant, 'Asia/Tokyo')).toBe('September 21, 2026');
    expect(formatTimestampDate(instant, 'America/Phoenix', true)).toBe('Sep 20');
  });

  it('handles year boundaries and equivalent explicit offsets', () => {
    expect(formatTimestampDate('2027-01-01T01:00:00Z', 'America/Phoenix')).toBe(
      'December 31, 2026',
    );
    expect(formatTimestampDate('2026-12-31T18:00:00-07:00', 'America/Phoenix')).toBe(
      'December 31, 2026',
    );
  });

  it('uses daylight-saving rules instead of a fixed UTC offset', () => {
    expect(formatTimestampDate('2026-01-15T04:30:00Z', 'America/New_York')).toBe(
      'January 14, 2026',
    );
    expect(formatTimestampDate('2026-07-15T04:30:00Z', 'America/New_York')).toBe('July 15, 2026');
  });

  it('keeps calendar-only medical dates independent of timestamp conversion', () => {
    expect(formatDate('2026-09-21')).toBe('September 21, 2026');
    expect(formatTimestampDate('2026-09-21T00:00:00Z', 'America/Phoenix')).toBe(
      'September 20, 2026',
    );
  });
});
