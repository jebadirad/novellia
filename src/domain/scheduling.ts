import { Temporal } from '@js-temporal/polyfill';
import { followUpGroup, todayIn, type FollowUpGroup } from './dates';

/** A clinic wall-clock time must identify exactly one instant. Never guess at DST transitions. */
export function appointmentInstant(day: string, time: string, timeZone: string): string {
  return Temporal.PlainDateTime.from(`${day}T${time}`)
    .toZonedDateTime(timeZone, { disambiguation: 'reject' })
    .toInstant()
    .toString();
}
export function appointmentTime(instant: string, timeZone: string): string {
  return Temporal.Instant.from(instant)
    .toZonedDateTimeISO(timeZone)
    .toPlainTime()
    .toString({ smallestUnit: 'minute' });
}
export function appointmentDisplay(instant: string, clinicZone: string, visitorZone: string) {
  const date = new Date(instant);
  const format = (timeZone: string) =>
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    }).format(date);
  const clinic = Temporal.Instant.from(instant).toZonedDateTimeISO(clinicZone);
  const visitor = Temporal.Instant.from(instant).toZonedDateTimeISO(visitorZone);
  const difference = (clinic.offsetNanoseconds - visitor.offsetNanoseconds) / 3_600_000_000_000;
  return {
    local: format(visitorZone),
    clinic: format(clinicZone),
    difference:
      difference === 0
        ? 'Same time at the clinic and where you are.'
        : `Clinic is ${Math.abs(difference)} ${Math.abs(difference) === 1 ? 'hour' : 'hours'} ${difference > 0 ? 'ahead of' : 'behind'} you on this date.`,
  };
}
export function scheduleGroup(
  record: {
    followUpOn: string | null;
    followUpCompletedAt: string | null;
    followUpAt: string | null;
    followUpTimeZone: string | null;
  },
  fallbackZone: string,
  now = new Date(),
): FollowUpGroup | null {
  if (!record.followUpOn) {
    return null;
  }
  if (record.followUpCompletedAt) {
    return 'completed';
  }
  if (record.followUpAt && new Date(record.followUpAt) < now) {
    return 'overdue';
  }
  return followUpGroup(
    record.followUpOn,
    null,
    todayIn(record.followUpTimeZone || fallbackZone, now),
  );
}

export function followUpSortValue(
  record: { followUpAt: string | null; followUpOn: string | null; followUpTimeZone: string | null },
  fallbackZone: string,
): number {
  if (record.followUpAt) {
    return Date.parse(record.followUpAt);
  }
  if (!record.followUpOn) {
    return Infinity;
  }
  return Temporal.PlainDate.from(record.followUpOn).toZonedDateTime(
    record.followUpTimeZone || fallbackZone,
  ).epochMilliseconds;
}
