'use client';

import { useSyncExternalStore } from 'react';
import { formatTimestampDate } from '@/domain/dates';

function subscribe() {
  return () => {
    // The timezone is read on render; this date display needs no running timer.
  };
}
function browserTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
function serverTimeZone() {
  // The server cannot know the visitor's browser timezone on the first request.
  return null;
}

export function LocalTimestamp({ value, compact = false }: { value: string; compact?: boolean }) {
  const timeZone = useSyncExternalStore(subscribe, browserTimeZone, serverTimeZone);
  const title = timeZone
    ? `${new Intl.DateTimeFormat('en-US', {
        timeZone,
        dateStyle: 'full',
        timeStyle: 'long',
      }).format(new Date(value))} (${timeZone})`
    : value;

  return (
    <time dateTime={value} title={title} aria-busy={!timeZone}>
      {timeZone ? formatTimestampDate(value, timeZone, compact) : '…'}
    </time>
  );
}
