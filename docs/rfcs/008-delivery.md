# RFC 008 — Delivery and verification

## Local environment

Node 24, npm lockfile, PostgreSQL 17 through Compose. Host port 54329 avoids assuming the standard PostgreSQL port is free. Bind the port to loopback. A named volume preserves data across container restarts.

The example environment has local-only demo credentials. Real hosted credentials are ignored by Git and never use NEXT_PUBLIC variables.

## Hosted architecture

One Next.js project on Vercel, Node runtime, hosted Prisma Postgres. Runtime uses a pooled connection and @vercel/functions attachDatabasePool. Prisma generates at install/build. A separate direct connection can be supplied for migrations.

Preview and Production use separate hosted databases. The build does not migrate, reset, or seed. Use the [deployment runbook](../deployment.md) for ordering, verification, and rollback limitations.

## Fixtures

Four deterministic pet IDs; twelve deterministic record IDs across three pets; the fourth pet demonstrates the empty-history state. Dates are relative to seed day. All content is fictional.

Upserts use empty updates, so rerunning seed does not overwrite edited rows. Explicit reset deletes all pets and reseeds, requires --confirm, and has no public route.

## Verification layers

- Unit: input schemas, unknown fields, date validity, display, ages, grouping.
- PostgreSQL integration: actual CRUD, search, pagination, foreign keys, cascade isolation, seed repeatability, follow-up transitions.
- Browser: pet CRUD, three typed record flows, dirty/type-change confirmations, failed-save retention, URL filters, invalid inputs, responsive layouts.
- Accessibility: keyboard focus and dialog checks plus automated axe WCAG A/AA scans.
- Delivery: production build, clean install/setup, app restart persistence, and live hosted smoke test when credentials are provisioned.

Integration tests enforce the dedicated database name. Browser fixtures are created through the API and removed afterward.

## Interview delivery

Provide the repository, README, master design document, eight RFCs, deployment runbook, and request-path walkthrough. Record a Loom under ten minutes separately.

AI usage is documented candidly. The reviewer should be able to trace a save, explain the JSON tradeoff, and implement a new type by changing domain and UI registration points.
