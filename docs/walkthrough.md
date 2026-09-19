# Understanding and extending Novellia Pets

## Read the application in this order

1. prisma/schema.prisma: two related entities and three useful indexes.
2. src/domain/schemas.ts: what a valid pet or record looks like.
3. src/domain/dates.ts: calendar dates and follow-up groups.
4. src/server/records.ts: persistence and follow-up state rules.
5. src/app/api/pets/[petId]/records/route.ts: HTTP boundary.
6. src/components/record-form.tsx: owner input and save flow.
7. src/app/pets/[petId]/records/[recordId]/page.tsx: saved record display.

## Trace one save

An owner opens Luna's Add record page. The Server Component validates the route ID, fetches Luna, and passes Luna's ID plus today's date to RecordForm.

RecordForm stores common values and type-specific values in React state. The selected explicit field component edits the details object.

On Save, recordInputSchema checks the combined input. Invalid fields get messages and focus. Valid input is sent as JSON to the nested POST endpoint.

The Route Handler parses JSON and runs the same schema again because browser validation is not trusted. It calls createRecord, which confirms the pet exists and uses Prisma to create a row.

PostgreSQL stores common searchable columns plus validated details JSON. The serializer returns a DTO with calendar dates as strings.

The form shows a toast, bypasses its dirty guard, navigates to detail, and refreshes the server view. The detail page loads directly through the same services.

## Why these choices?

**Why no NestJS?** This app has one UI and straightforward CRUD. Next routes supply the HTTP boundary without another application or framework lifecycle.

**Why PostgreSQL?** The same relational database runs locally and remotely, and its storage survives Vercel function termination and redeployments.

**Why JSON details?** New record types reuse the same table and CRUD operations. Strict runtime validation preserves structure. The cost is less convenient SQL reporting over type-specific fields.

**Why no stored status?** Overdue changes as time passes. Store due date and completion, then derive the status from today's date.

**Why DATE instead of a timestamp for a visit?** An owner enters a calendar day. Converting that to an arbitrary browser timezone can move it to the previous day.

**Why validate twice?** Client validation is for feedback; server validation is the actual trust boundary.

**What is one imperfect decision?** JSON detail schemas are easy to extend but put detailed reporting behind application code. Promote fields to columns/relations when reporting requirements become concrete.

## Extension rehearsal

Use a temporary branch to practice a lab_result type, then remove the exercise before submission unless you want it as a product feature.

1. Add labResultDetails = z.strictObject({ testName, result, referenceRange }) using existing requiredText/optionalText helpers.
2. Add a literal lab_result option to recordSchema's discriminated union.
3. Add metadata and an icon. TypeScript reports the missing entries in exhaustive maps.
4. Add LabResultFields in record-fields.tsx, register it, and add a detail renderer/switch case.
5. Add a unit validation example and an integration/browser create/read example.
6. Run typecheck, tests, and build.
7. Demonstrate a saved lab result under a pet; filtering and follow-ups should work without service rewrites.

An existing type's schema change is a separate problem: migrate existing details or introduce a detailsVersion reader. Do not silently reinterpret old JSON.

## Seven-minute Loom outline

- 0:00–0:45: owner problem and intentional scope.
- 0:45–3:00: pets, add a typed record, search, complete a follow-up.
- 3:00–4:30: trace a save through form, route, schema, service, database.
- 4:30–5:30: show record-type extension points.
- 5:30–6:30: explain JSON/reporting tradeoff, shared demo, and future auth ownership checks.
- 6:30–7:00: local setup and verification evidence.

Before recording, narrate the save path without notes. The code should support your explanation, not substitute for it.
