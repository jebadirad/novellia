# RFC 001 — Architecture and data model

## Intent and boundaries

One Next.js application contains rendering and a small backend. Ordinary service functions separate business rules from HTTP parsing and UI components. Pages call services directly; browser mutations pass through API routes.

## Data model

Pet has many MedicalRecord rows. The pet foreign key uses ON DELETE CASCADE. CareProvider links separately through nullable providerId and followUpProviderId, both with ON DELETE RESTRICT; see [RFC 009](009-care-providers.md).

| Pet field | PostgreSQL / application rule                              |
| --------- | ---------------------------------------------------------- |
| id        | UUID, generated once                                       |
| name      | varchar(80), trimmed, required; duplicate names allowed    |
| species   | text; dog, cat, bird, rabbit, reptile, small_mammal, other |
| breed     | nullable varchar(100)                                      |
| birthDate | nullable DATE; no future dates                             |
| sex       | text; male, female, unknown; default unknown               |
| notes     | nullable text; maximum 2,000 characters in API             |
| createdAt | timestamptz(3), server managed                             |
| updatedAt | timestamptz(3), server managed                             |

| MedicalRecord field  | PostgreSQL / application rule                                                     |
| -------------------- | --------------------------------------------------------------------------------- |
| id                   | UUID                                                                              |
| petId                | UUID foreign key                                                                  |
| type                 | application-validated text, deliberately not a database enum                      |
| title                | required varchar(120)                                                             |
| occurredOn           | DATE; required, not in future                                                     |
| providerId           | nullable UUID foreign key to CareProvider (ON DELETE RESTRICT)                    |
| notes                | nullable text; maximum 5,000 characters                                           |
| details              | required JSONB, validated by selected type                                        |
| detailsVersion       | integer, server-managed, default 1                                                |
| followUpOn           | nullable DATE, on/after occurredOn                                                |
| followUpProviderId   | nullable UUID FK; required for new follow-ups, legacy unassigned entries retained |
| followUpAt           | nullable timestamptz(3), server-derived appointment instant                       |
| followUpTimeZone     | nullable varchar(100), server-derived timezone snapshot                           |
| followUpNote         | nullable varchar(240), cleared when due date removed                              |
| followUpCompletedAt  | nullable timestamptz(3), assigned by completion operation                         |
| createdAt, updatedAt | server-managed timestamptz(3)                                                     |

Indexes: providerId, followUpProviderId, (petId, occurredOn), (type, occurredOn), and (followUpCompletedAt, followUpOn). Age, follow-up groups, and dashboard totals are derived; none are stored.

## API contract

Create endpoints accept editable fields and return the created DTO with 201. Reads and updates return JSON with 200. Deletions return 204 without a body.

Medical-record PATCH uses omission to preserve a value and explicit `null` to clear an optional value. Empty strings are rejected at this API boundary; forms normalize empty optional controls to null before submitting. Supplied `details` fields merge with existing details: omitted keys survive, null clears optional keys, and required keys cannot be cleared. Unknown and server-managed fields are rejected. Pet and type cannot change.

The service locks the record, merges against the current row, validates the complete result, and writes within one transaction. An empty object is accepted and preserves editable values (updatedAt may advance). Concurrent editable changes use last successful write wins; omitted fields and server-managed completion are preserved.

| Request                                                      | Result                                                                                               |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `{ "notes": "Updated" }`                                     | Change only notes; preserve appointment and completion                                               |
| `{ "notes": null, "providerId": null }`                      | Clear notes and historical provider; preserve the follow-up provider                                 |
| `{ "details": { "assessment": null } }`                      | Clear assessment; preserve the visit reason                                                          |
| `{ "followUpTime": null }`                                   | Convert to a date-only reminder and reopen it                                                        |
| `{ "followUpOn": null }`                                     | Remove the follow-up, including provider, time, zone snapshot, note, and completion                  |
| Changed follow-up date, time, or provider                    | Revalidate the complete schedule and reopen it                                                       |
| `{ "followUpProviderId": null }` while retaining a follow-up | Reject with 422; a retained follow-up needs a provider, except unchanged legacy unassigned reminders |

Removing a follow-up cannot also supply non-null follow-up fields. Follow-up values without a date are rejected. Validation failures leave the record unchanged. Use the dedicated `{ "completed": true/false }` endpoint for completion; general PATCH cannot write completion timestamps.

Unknown body fields are rejected. Null/nonobject JSON is 400. Field validation is 422 with `error.code`, `error.message`, and `error.fieldErrors` keyed by dot-separated paths. Missing or cross-pet items are 404. Unexpected errors are logged server-side and return a generic 500 response.

Duplicate providers and deletion of linked providers return 409. Unavailable address suggestions return 503; provider saves may succeed with an unresolved timezone.

Query failures are 400 for APIs; pages show a visible query error without executing an invalid database query.

## Persistence and deployment

The runtime uses a pg Pool with maximum five connections and a Prisma PostgreSQL adapter. Vercel deployments attach the pool to the Fluid lifecycle helper. Development caches the client/pool on globalThis for hot reload.

Production storage is remote PostgreSQL. No runtime state is stored on Vercel's filesystem. Migrations and seeding are explicit release operations, not page-load side effects.

## Verification

Real PostgreSQL integration tests cover creation, updates, duplicate names, filtering, pagination, cascade isolation, follow-up transitions, and repeat-safe seeding. Build/type checks verify server/client boundaries and DTO compatibility.

## Scheduling boundary

Record input accepts followUpProviderId and optional followUpTime (HH:mm). It never accepts followUpAt or followUpTimeZone directly. Provider input likewise rejects a supplied timeZone. Services derive these fields using the provider address, as specified in [RFC 010](010-clinic-scheduling.md). CareProvider fields and counts are in [RFC 009](009-care-providers.md).
