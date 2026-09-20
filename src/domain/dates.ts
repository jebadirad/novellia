/** Calendar dates stay YYYY-MM-DD. Never format them in the browser's timezone. */
export function todayIn(timeZone = 'America/Phoenix', now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}
export function addDays(day: string, count: number): string {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + count);
  return date.toISOString().slice(0, 10);
}
export function dateOnly(date: Date | null): string | null {
  return date?.toISOString().slice(0, 10) ?? null;
}
export function toDate(day: string | null | undefined): Date | null {
  return day ? new Date(`${day}T00:00:00Z`) : null;
}
export function formatDate(day: string | null, compact = false): string {
  if (!day) {
    return 'Not recorded';
  }
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    month: compact ? 'short' : 'long',
    day: 'numeric',
    ...(compact ? {} : { year: 'numeric' as const }),
  }).format(toDate(day)!);
}
export function petAge(birthDate: string | null, today: string): string {
  if (!birthDate) {
    return 'Age unknown';
  }
  const [year, month, day] = birthDate.split('-').map(Number);
  const [thisYear, thisMonth, thisDay] = today.split('-').map(Number);
  const years =
    thisYear - year - (thisMonth < month || (thisMonth === month && thisDay < day) ? 1 : 0);
  if (years >= 1) {
    return `${years} ${years === 1 ? 'year' : 'years'} old`;
  }
  const months = (thisYear - year) * 12 + thisMonth - month - (thisDay < day ? 1 : 0);
  return months > 0
    ? `${months} ${months === 1 ? 'month' : 'months'} old`
    : 'Less than a month old';
}
export type FollowUpGroup = 'overdue' | 'today' | 'soon' | 'later' | 'completed';
export function followUpGroup(due: string, completed: string | null, today: string): FollowUpGroup {
  if (completed) {
    return 'completed';
  }
  if (due < today) {
    return 'overdue';
  }
  if (due === today) {
    return 'today';
  }
  return due <= addDays(today, 30) ? 'soon' : 'later';
}
export const followUpLabels: Record<FollowUpGroup, string> = {
  overdue: 'Overdue',
  today: 'Due today',
  soon: 'Next 30 days',
  later: 'Later',
  completed: 'Completed',
};
