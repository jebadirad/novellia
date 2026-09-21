# Understanding and extending Novellia Pets

## Read the code in this order

1. `prisma/schema.prisma`: Pet, MedicalRecord, and CareProvider; the two distinct provider relationships; calendar dates versus timestamps.
2. `src/domain/schemas.ts` and `providers.ts`: editable input, strict record details, and provider validation.
3. `src/domain/dates.ts` and `scheduling.ts`: calendar formatting, UTC conversion, DST rejection, display differences, and status.
4. `src/server/records.ts` and `follow-up-scheduling.ts`: persistence, provider checks, schedule snapshots, and completion.
5. `src/app/api/pets/[petId]/records/route.ts`: creation HTTP boundary.
6. `src/components/record-form.tsx`: input, provider dialogs, appointment preview, validation, and save.
7. `src/app/pets/[petId]/records/[recordId]/page.tsx`: saved details, follow-up actions, and local timestamp display.

## Trace a save

The Add record Server Component validates the route, loads the pet and available providers, and passes their data plus the app's current calendar day to RecordForm. The page calls services directly rather than fetching its own API.

RecordForm keeps common and type-specific values in React state. An explicit field component edits the selected details shape. The medical provider and follow-up provider are separate selections. A provider dialog is a sibling form so saving it cannot submit the medical record accidentally.

Save validates with recordInputSchema for immediate feedback. The form sends JSON through mutate to the nested POST endpoint. The Route Handler parses the body and repeats validation because browser input is untrusted. createRecord checks the pet and starts a transaction. It validates provider links and calls followUpData to preserve or derive the schedule before writing with Prisma.

The serializer returns calendar dates as YYYY-MM-DD and timestamps as full ISO instants, with related providers and a derived follow-up status. The form shows a toast, bypasses its dirty guard, navigates to detail, and refreshes server data. The detail page reads through the service again.

The UI sends the complete editable record. The partial PATCH API currently has a scheduling-field merge gap: callers must include existing followUpProviderId and followUpTime for linked follow-ups. See [known limitations](verification.md#known-limitations); do not describe this as fixed.

## Trace an address and appointment

1. `address-picker.tsx` searches the application address endpoint with cancellation. `address-search.ts` bounds, validates, caches, and maps Photon responses, including coordinates.
2. Provider save runs `provider-location.ts`: match the complete address, resolve geographic timezone with geo-tz, and store the server-derived IANA zone. There is no editable timezone dropdown. Failed resolution preserves manual address entry but leaves the zone unresolved.
3. The record form accepts a clinic calendar date and optional clock time. `appointmentInstant` uses Temporal with disambiguation reject. A repeated or skipped daylight-saving hour must be corrected instead of guessed.
4. The server independently calculates and stores followUpAt in UTC and followUpTimeZone as a snapshot. A clinic relocation does not move a saved appointment. Rescheduling uses the selected provider's current resolved zone and clears completion.
5. `AppointmentDisplay` shows clinic time immediately and adds browser-local time after hydration. Both dates and the difference use the appointment date's daylight-saving rules. `LocalTimestamp` separately handles completed/added/updated metadata.
6. `recordDto` computes status through scheduleGroup. Dashboard, lists, and badges use that same status. Scheduled appointments become overdue at their instant; date-only reminders use the saved clinic day, with APP_TIME_ZONE as fallback.

## Trace search and test safety

`filters.tsx` stores committed filters in the URL and debounces draft text. Back/Forward cancels the pending timer before the restored page finishes. Filter selections combine pending text with the new filter, and earlier responses cannot replace newer typing. Next navigation handles record search; AbortController is used separately for address fetches.

`tests/database-lifecycle.ts` validates the exact dedicated database name before deletion. Rejected setup does not permit destructive cleanup. A finally path still closes database resources. Integration tests intentionally clear the test database; browser fixtures remove their own records. External test-server configuration must also point to that database.

## Explain the choices

- **One Next.js app:** ordinary functions and Route Handlers fit this CRUD scope without a second backend lifecycle.
- **PostgreSQL:** persistent remote storage survives Vercel function lifetimes. Local persistence has been verified; hosted redeployment checks remain pending.
- **JSON details:** types reuse tables and CRUD infrastructure, with Zod enforcing shape. Detailed SQL reporting is the tradeoff.
- **Derived status:** overdue changes as time passes, so compute it on reads instead of persisting a label.
- **DATE versus timestamptz:** a visit day must not shift with the viewer's timezone; an appointment instant must convert. Store the clinic timezone separately because the instant alone does not retain that scheduling context.
- **Provider snapshot:** identity is relational and provider names remain editable, while the appointment timezone/instant is preserved deliberately.
- **Demo-scale queries:** open follow-ups are loaded and classified/sorted in application code. Larger installations would need an indexed actionable deadline and database filtering.
- **Styling:** Astryx components retain their behavior and token-based appearance; Tailwind handles layout using the same tokens.

## Extension rehearsal

Practice on a temporary branch, such as codex/lab-result-rehearsal. The lab-result type is an exercise, not an implemented feature.

1. Add a strict labResultDetails schema with testName, result, and optional referenceRange.
2. Add a lab_result discriminated-union option to recordSchema.
3. Add metadata and a record-form icon; TypeScript exposes missing exhaustive entries.
4. Add and register LabResultFields in record-fields.tsx. Add the detail renderer and explicit narrowing switch case in record-details.tsx.
5. Add validation and integration create/read coverage; include a browser case if the new field interaction warrants it.
6. Run typecheck, lint, tests, and build.
7. Demonstrate persistence, filtering, and follow-up scheduling without rewriting CRUD services.

Changing an existing type's stored shape needs a deliberate migration or detailsVersion-aware reader. Do not silently reinterpret old JSON.

## Seven-minute Loom outline

- 0:00–0:45: owner problem, fictional shared data, scope.
- 0:45–2:30: pet history, typed record, provider reuse, search.
- 2:30–3:30: clinic appointment and Arizona/California winter/summer display; completion.
- 3:30–4:45: trace form, route, validation, service, database, refresh.
- 4:45–5:45: demonstrate extension points.
- 5:45–6:30: JSON, timezone, ownership, and scale tradeoffs.
- 6:30–7:00: local setup, actual verification, and pending hosted deployment.

Rehearse the save path without notes and distinguish tested behavior from planned work. Recording the Loom remains the owner's handoff step.
