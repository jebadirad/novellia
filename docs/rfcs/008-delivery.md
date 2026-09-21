# RFC 008 — Delivery and verification

Current delivery blockers and test evidence are tracked in [verification](../verification.md). In particular, fresh migration ordering needs correction before clean setup or hosted provisioning; previously upgraded local databases are not evidence that this path passes.

## Local environment

Node 24, npm lockfile, PostgreSQL 17 through Compose. Host port 54329 avoids assuming the standard PostgreSQL port is free. Bind the port to loopback. A named volume preserves data across container restarts.

The example environment has local-only demo credentials. Real hosted credentials are ignored by Git and never use NEXT_PUBLIC variables.

## Hosted architecture

One Next.js project on Vercel, Node runtime, hosted Prisma Postgres. Runtime uses a pooled connection and @vercel/functions attachDatabasePool. Prisma generates at install/build. A separate direct connection can be supplied for migrations.

Preview and Production use separate hosted databases. The build does not migrate, reset, or seed. Use the [deployment runbook](../deployment.md) for ordering, verification, and rollback limitations.

## Fixtures

Four deterministic pet IDs; twelve deterministic record IDs across three pets; the fourth pet demonstrates the empty-history state. Dates are relative to seed day. All content is fictional.

Upserts use empty updates, so rerunning seed does not overwrite edited rows. Explicit reset deletes all pets, cascaded records/follow-ups, and providers, then reseeds, requires --confirm, and has no public route.

## Verification layers

- Unit: schemas, calendar dates, browser timestamp conversion, clinic scheduling/DST, geographic boundaries, contact validation, phone masking, and database safety.
- PostgreSQL integration: actual CRUD, search, pagination, foreign keys, cascade isolation, seed repeatability, follow-up transitions, appointment snapshots, and provider protections.
- Browser: pet CRUD, three typed record flows, dirty/type-change confirmations, failed-save retention, URL filters, invalid inputs, responsive layouts.
- Accessibility: keyboard focus and dialog checks plus automated axe WCAG A/AA scans.
- Delivery: production build, clean install/setup, app restart persistence, and live hosted smoke test when credentials are provisioned.

Integration tests enforce the dedicated database name. Browser fixtures are created through the API and removed afterward; fixed timestamp and timezone fixtures additionally use guarded direct test-database writes. See [verification](../verification.md) for evidence, known gaps, and the distinction between verified local behavior and pending hosted checks.

## Interview delivery

Provide the repository, README, master design document, ten RFCs, deployment runbook, and request-path walkthrough. Record a Loom under ten minutes separately.

AI usage is documented candidly. The reviewer should be able to trace a save, explain the JSON tradeoff, and implement a new type by changing domain and UI registration points.
