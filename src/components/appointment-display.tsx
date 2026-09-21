'use client';
import { useSyncExternalStore } from 'react';
import { appointmentDisplay } from '@/domain/scheduling';
const subscribe = () => () => {};
const browserZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
const serverZone = () => null;
export function AppointmentDisplay({
  instant,
  timeZone,
  providerName,
}: {
  instant: string;
  timeZone: string;
  providerName: string;
}) {
  const visitorZone = useSyncExternalStore(subscribe, browserZone, serverZone);
  const display = appointmentDisplay(instant, timeZone, visitorZone ?? timeZone);
  return (
    <div className="my-3 space-y-1 rounded-md bg-muted p-3 text-sm" aria-label="Appointment time">
      {visitorZone && (
        <p className="font-semibold">
          <time dateTime={instant}>{display.local}</time> · Your time
        </p>
      )}
      <p className="text-secondary">
        <time dateTime={instant}>{display.clinic}</time> · {providerName}
      </p>
      {visitorZone && <p className="text-xs text-secondary">{display.difference}</p>}
    </div>
  );
}
