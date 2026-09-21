# RFC 007 — Follow-up tracking

## Model and motivation

One optional follow-up belongs to a medical record. It has a due date, optional short action description, and optional completion timestamp. This turns stored history into a next step without another entity, scheduler, or notification service.

## Screen

Title and subtitle, Open/Completed pills, pet filter, then grouped panels. Each item shows species avatar, action (or record title), pet, due/completed date, a text status badge, and completion/reopen action.

Open groups:

- Overdue: due before today.
- Due today: due equals today.
- Next 30 days: after today through today + 30 inclusive.
- Later: beyond that window.

Completed entries order by completion timestamp descending, then ID. Open entries order by due date then ID. Empty screens explain the state and link to Records.

## Transitions

| Operation                    | Result                                          |
| ---------------------------- | ----------------------------------------------- |
| Mark complete                | Assign server timestamp if not already complete |
| Repeat complete              | Preserve original completion timestamp          |
| Reopen                       | Clear completion timestamp                      |
| Repeat reopen                | Remain open                                     |
| Change due date              | Reopen                                          |
| Edit unrelated record fields | Preserve completion                             |
| Remove due date              | Clear action note and completion                |
| Delete record or parent pet  | Remove follow-up                                |

PATCH /api/pets/:petId/records/:recordId/follow-up accepts exactly { completed: boolean }. It assigns desired state rather than toggling. A conditional database update makes repeated completion requests idempotent. A missing record is 404; a record without a follow-up is 422.

General record updates run inside a transaction to compare the prior due date and apply the appropriate completion change.

## Dates and limits

One configured app timezone defines today; calendar comparisons use YYYY-MM-DD. Dashboard due count includes today; dashboard overdue count is separate.

There is no email, push notification, automatically recurring task, clinical recommendation, or background worker. More than one task per record would motivate a separate FollowUp table.

## Acceptance

Exercise complete/reopen from all entry points, rescheduling, removing a follow-up, repeat requests, deleting parent data, midnight boundaries, leap day, and month/year rollover.

## Timestamp display

Completed, added, and updated timestamps are stored as PostgreSQL timestamptz and serialized as full UTC ISO instants. The shared LocalTimestamp component displays their dates in each visitor's browser timezone; its tooltip includes the local time and timezone. The initial server render uses a brief placeholder until the browser timezone is available, preventing a hydration mismatch or a misleading UTC date.

Calendar-only fields (birth date, medical event date, medication end date, and follow-up due date) remain YYYY-MM-DD and do not shift across timezones. APP_TIME_ZONE still defines today for validation and overdue/upcoming classification in this shared demo. Browser-local timestamp display does not change those shared business-day rules. No database migration or additional stored timezone is required.
