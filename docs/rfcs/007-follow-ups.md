# RFC 007 — Follow-up tracking

## Model and motivation

One optional follow-up belongs to a medical record. It has a due date, selected provider, optional clinic-local appointment time, optional short action description, and optional completion timestamp. RFC 010 specifies appointment scheduling. This turns stored history into a next step without another entity, scheduler, or notification service.

## Screen

Title and subtitle, Open/Completed pills, pet filter, then grouped panels. Each item shows species avatar, action (or record title), pet, due/completed date, a text status badge, and completion/reopen action.

Open groups:

- Overdue: a date-only reminder due before the clinic’s today, or an appointment whose instant has passed.
- Due today: due equals today.
- Next 30 days: after today through today + 30 inclusive.
- Later: beyond that window.

Completed entries order by completion timestamp descending, then ID. Open entries order by scheduled instant, treating date-only reminders as the start of their clinic day, then ID. Empty screens explain the state and link to Records.

## Transitions

| Operation                      | Result                                          |
| ------------------------------ | ----------------------------------------------- |
| Mark complete                  | Assign server timestamp if not already complete |
| Repeat complete                | Preserve original completion timestamp          |
| Reopen                         | Clear completion timestamp                      |
| Repeat reopen                  | Remain open                                     |
| Change date, time, or provider | Reopen                                          |
| Edit unrelated record fields   | Preserve completion                             |
| Remove due date                | Clear schedule, provider, note, and completion  |
| Delete record or parent pet    | Remove follow-up                                |

PATCH /api/pets/:petId/records/:recordId/follow-up accepts exactly { completed: boolean }. It assigns desired state rather than toggling. A conditional database update makes repeated completion requests idempotent. A missing record is 404; a record without a follow-up is 422.

General record updates run inside a transaction to compare the prior date, time, and provider and apply the appropriate completion change.

## Dates and limits

Date-only reminders use the resolved clinic calendar day, with APP_TIME_ZONE as the fallback for unresolved legacy locations. Appointments use their scheduled UTC instant for overdue status. Dashboard and list groups share the same computed status; due count includes today and the next 30 calendar days in the clinic timezone, excluding overdue appointments.

There is no email, push notification, automatically recurring task, clinical recommendation, or background worker. More than one task per record would motivate a separate FollowUp table.

## Acceptance

Exercise complete/reopen from all entry points, rescheduling, removing a follow-up, repeat requests, deleting parent data, midnight boundaries, leap day, and month/year rollover.

## Timestamp display

Completed, added, and updated timestamps are stored as PostgreSQL timestamptz and serialized as full UTC ISO instants. The shared LocalTimestamp component displays their dates in each visitor's browser timezone; its tooltip includes the local time and timezone. The initial server render uses a brief placeholder until the browser timezone is available, preventing a hydration mismatch or a misleading UTC date.

Calendar-only fields (birth date, medical event date, medication end date, and follow-up due date) remain YYYY-MM-DD and do not shift across timezones. APP_TIME_ZONE defines today for historical-date validation and is the fallback for legacy reminders whose provider location is unresolved. Follow-ups use their clinic timezone when resolved; scheduled appointments become overdue at their exact instant. Browser-local timestamp display does not change stored calendar dates. See RFC 010 for clinic scheduling.
