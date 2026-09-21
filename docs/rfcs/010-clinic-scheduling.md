# RFC 010 — Clinic scheduling

## Behavior

A follow-up selects its own vet or clinic, defaulting to the medical record's provider. Referrals can use another provider. New follow-ups require a provider. Legacy unassigned reminders remain readable and editable; rescheduling requires a provider.

Choose a date and optionally an appointment time. Astryx TimeInput uses a consistent 12-hour display. Enter the time given by the clinic; leaving it empty creates a date-only reminder. The form previews both the browser-local time and clinic time. Details, follow-up lists, dashboard attention items, and pet profiles use the same display. Both dates and the offset difference are shown, including midnight crossings and equal clock times.

9 AM in California on January 15, 2027 is 10 AM in Phoenix; on July 15 it is 9 AM in Phoenix. The conversion uses the appointment date, never a fixed Pacific/Mountain offset.

## Address resolution

There is no editable timezone field. Provider save geocodes the address through Photon and derives its IANA timezone from coordinates using geo-tz. The server requires matching street, city, state, and five-digit ZIP. Incomplete addresses, missing coordinates, conflicting matches, or lookup failure leave the timezone unresolved. Selecting an address suggestion can correct street abbreviations that do not match.

Manual addresses and date-only reminders remain usable during lookup failures. Timed appointments require a resolved address. The record form offers Update provider address without discarding record fields. Provider details display the derived zone or unresolved status. Unchanged addresses reuse the resolved zone; changed or cleared addresses resolve again or clear it. Existing providers resolve when saved, with no network calls during migrations.

Photon's public endpoint has no availability guarantee. No API key or paid timezone service is used. geo-tz runs server-side; Next.js function tracing includes its required 1970 boundary dataset and excludes unused datasets. Keep the package and runtime timezone database updated as laws change.

## Persistence and API

| Model         | New field          | Meaning                                             |
| ------------- | ------------------ | --------------------------------------------------- |
| CareProvider  | timeZone           | Nullable, server-derived IANA identifier            |
| MedicalRecord | followUpProviderId | Nullable provider foreign key; restrictive deletion |
| MedicalRecord | followUpAt         | Nullable timestamptz; UTC appointment instant       |
| MedicalRecord | followUpTimeZone   | Zone snapshot used when scheduling                  |

followUpOn remains the clinic's calendar date. Record input accepts followUpProviderId and optional followUpTime (HH:mm). Client-supplied instants and timezone snapshots are rejected. Services derive them server-side. The DTO includes provider, instant, zone, clinic clock time, and computed status.

The migration backfills follow-up provider links from existing record providers where available and preserves existing dates and completion timestamps. Nullable fields accommodate legacy data. A database check requires timed appointments to have a date, provider, and zone. Either medical records or follow-ups prevent provider deletion; archive preserves both.

Unrelated edits retain the instant, zone snapshot, and completion. A clinic relocation cannot silently move an appointment. Changing date, time, or provider recomputes the schedule and reopens it. Removing a follow-up clears its provider, instant, zone, note, and completion together.

## Time and status rules

Temporal converts clinic clock times with disambiguation set to reject. Skipped or repeated daylight-saving hours return a field error asking the owner to confirm another time with the clinic. Selecting between repeated-hour occurrences is a future enhancement.

Appointments become overdue after their exact instant. Date-only reminders use their saved clinic timezone; unresolved legacy locations fall back to APP_TIME_ZONE (America/Phoenix). Lists, badges, and dashboard counters share the computed status. Open follow-ups sort by instant, placing date-only reminders at the start of their clinic day; IDs break ties.

Completed, added, and updated timestamps still use the browser timezone. Historical calendar dates never shift. The browser zone is read after hydration; the initial server render shows clinic time. No location permission is required.

For the current partial PATCH scheduling-field limitation and fresh migration ordering blocker, see [verification](../verification.md#known-limitations). The full form save path has been tested; these separate paths must not be described as verified.

## Verification and tradeoffs

Tests cover California/Arizona winter and summer, midnight crossings, DST gaps and overlaps, clinic-day status, geographic boundaries including Navajo Nation, UTC persistence, distinct provider links, deletion/archive rules, clearing addresses, snapshot preservation, reopening, removal, desktop/mobile forms, refresh, completion, and automated accessibility.

For this shared demo, open follow-ups are classified and sorted in application code to apply each clinic's timezone consistently. At larger scale, persist/index an actionable deadline and filter in SQL. No external notifications, recurrence, invitations, travel-time calculation, or separate appointment entity is included.

Libraries: [geo-tz](https://github.com/evansiroky/node-geo-tz) and [Temporal polyfill](https://github.com/js-temporal/temporal-polyfill). Geographic boundaries originate from OpenStreetMap through timezone-boundary-builder.
