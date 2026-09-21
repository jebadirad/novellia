# RFC 006 — Overview dashboard

## Goal

Show the owner's pets, upcoming obligations, and recent medical history without inventing health assessments.

## Layout

```text
Your pets, at a glance                     [Add record]
A little care, all together.
[Warm introductory panel with species illustrations]

[Pet count]     [Overdue count]     [Due in 30 days]

[Attention list]                    [Pet summaries]
 Due date, pet, action               Name, species/breed,
 and linked record                  record count

[Recent medical history]
 Type, linked title, pet, clinic, event date
```

Below tablet widths the attention and pet panels stack. Summary tiles remain a compact row on mobile.

## Data

One dashboard service fetches independent reads in parallel:

- total pet count;
- open follow-ups, serialized/classified using each saved clinic timezone and appointment instant;
- overdue and today/next-30-day counts derived from those same statuses;
- up to five attention items ordered by instant, using start of clinic day for date-only reminders, then ID;
- up to six pets;
- five most recent medical events.

All values are computed from PostgreSQL; no counters are persisted.

## Navigation and mutation

Pet count links to Pets. Overdue count links to the overdue follow-up scope. Due-in-30-days links to the due scope. Attention entries link to record detail and support completion. Pet entries link to profile. Recent records link to detail.

Add record opens the shared pet picker. With no pets, it points to pet creation.

## Empty states and acceptance

No pets shows a welcome/create panel. Pets without records still appear. No upcoming tasks says there are no follow-ups due in 30 days; it does not imply good health.

After a mutation and route refresh, counts and lists must agree with the follow-up page. Date boundaries use the same domain utilities.

Appointment attention items show browser-local and clinic times. Date-only due labels and recent medical-history dates include the year. Classification is shared with the follow-up page; it is recalculated on reads, not maintained by a background clock. The current demo loads open follow-ups for application-side classification, rather than separate SQL count queries.
