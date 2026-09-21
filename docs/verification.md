# Verification and remaining work

## Evidence as of September 20, 2026

This records checks completed during implementation, not a guarantee about every later revision. The latest coverage sweep passed lint, type checking, formatting, 84 unit tests, 13 PostgreSQL integration tests, a production build, and all 25 Chromium browser tests against that production build. Hosted smoke checks and redeployment persistence are also verified below. See the [coverage map](testing.md).

| Check                   | Latest recorded result                                                                                                                                                                   |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit tests              | 84 passed: domain validation, PATCH contract, dates/timezones, phone/contact rules, geocoder failures/ambiguity, HTTP errors, test-database safety                                       |
| PostgreSQL integration  | 13 passed: real route CRUD/scoping, filters/pagination, scheduling, concurrent updates, dashboard consistency, migrations and failure rollback                                           |
| Browser tests           | 25 passed against the production build without retries; includes edit-time clearing/removal plus existing desktop/mobile, accessibility, search, provider, phone, and timezone workflows |
| Build                   | Production build passed during the coverage sweep; dynamic pages/routes retained                                                                                                         |
| Static checks           | Lint, typecheck, and formatting passed during the coverage sweep                                                                                                                         |
| Accessibility           | Automated axe checks and exercised keyboard/dialog/form workflows passed; not a complete manual accessibility audit                                                                      |
| Responsive behavior     | Workflow checks at 375, 768, and 1440 pixels; appointment details visually reviewed on desktop/mobile                                                                                    |
| Real address resolution | Application lookup and a temporary test provider resolved a public address to America/New_York; the fixture was removed                                                                  |
| Deployment assets       | Build traces include geo-tz's required 1970 boundary data and exclude unused datasets                                                                                                    |

The latest browser run includes the year-inclusive calendar-date change and migration/PATCH fixes. Dependency audits previously reported no known vulnerabilities; this coverage sweep did not rerun the dependency audit.

Earlier local checks verified clean installation, app-restart persistence, and provider/address migrations without resetting existing records. These are historical local checks, not remote deployment proof. Screenshots and temporary evidence live in ignored `artifacts/` and test-output directories.

## Test environment and safety

Local development uses Docker PostgreSQL with a named volume. Integration and browser checks use `novellia_test`. `tests/database-lifecycle.ts` checks the PostgreSQL URL and exact database name before deletion, prevents cleanup deletion after rejected setup, and closes Prisma/pool resources even on failure. Direct browser database fixtures also invoke the guard. External browser-server configuration remains the operator's responsibility: its API must point to the same dedicated test database.

Windows Chromium was used against WSL. The older Ubuntu distribution could not run the installed Linux Chromium. Tracing is off by default after observed streamed-page stalls with recording enabled; occasional initial-load stalls were also observed earlier. Their root cause is unconfirmed. The latest complete 25-test run passed without retries.

## Hosted deployment verified

Live application: https://novellia-pets.vercel.app, project novellia-pets under jebadirads-projects. Separate free Prisma Postgres resources in iad1 serve Production and Preview. All six migrations and the fictional seed were applied independently to each. A production-only fixture was confirmed absent from Preview.

Remote smoke checks verified pet creation, all three record types, partial updates preserving schedules/completion, complete/reopen idempotence, search, and deletion. A provider using a public New York address resolved to America/New_York on Vercel, exercising the packaged geo-tz boundary assets. The browser displayed the clinic's 9 AM EDT appointment as 6 AM MST locally. Main pages and direct pet/record URLs returned 200, and the rendered dashboard loaded successfully.

A second successful production deployment preserved the temporary pet and all three saved records. Those smoke-test fixtures were then removed by their exact IDs, leaving the fictional demo data intact. Production deployment ID: dpl_8zhamJqDoUw9RnYK52A4xbzUrdCW. No database migration or seed ran during the Vercel build.

GitHub authentication initially blocked a redeployment until the owner connected the matching GitHub account. That connection is now established and CLI deployment succeeds. The repository connection is now verified as jebadirad/novellia, with main as the production branch and automatic Git deployments enabled. A post-connection Git push has not yet been exercised. See [deployment.md](deployment.md).

## Known limitations

- **Unresolved clinic location:** date-only reminders remain available and use APP_TIME_ZONE when no timezone snapshot exists. Timed creation/rescheduling requires a resolved address. Existing clinics resolve when their address is saved, not during migration.
- **DST overlaps/gaps:** invalid or ambiguous local times are rejected; there is no UI for choosing between two occurrences of the repeated hour.
- **Time-sensitive status:** status is recomputed on server reads/refresh, not by a continuously running client clock.
- **Compact completion labels:** use the browser timezone but omit the year. Medical-history event dates and follow-up due dates include it.
- **Development warning:** Astryx 0.6.2 DateInput was observed forwarding nativePicker to a DOM element, producing a React warning. No package internals are patched. Recheck when upgrading.
- **Scale and ownership:** shared unauthenticated data, last successful write wins, application-side open-follow-up classification/sorting, no production clinical audit guarantees.

## Interview handoff

The repository includes a master design, ten RFCs, setup/deployment instructions, and a [request-path walkthrough](walkthrough.md). The owner-led extension rehearsal and Loom recording remain human handoff steps. Describe the app as deployed with the local suites and hosted smoke checks listed here; the Loom and owner-led extension rehearsal remain separate handoff steps.

## Fresh setup and PATCH verification

A separate clean source copy, without node_modules, generated clients, build output, or local environment files, passed npm ci and a production build. Against a newly created disposable PostgreSQL database, npm run db:migrate succeeded twice and npm run db:seed succeeded twice, yielding four pets and twelve records. The disposable database was removed afterward. Existing local development and test databases also upgraded through the guarded history reconciliation without a reset.

The permanent migration test uses a uniquely named empty schema inside the guarded novellia_test database. It invokes the actual migration command, repeats it, compares the resulting schema to schema.prisma, simulates the old applied migration name, and verifies changed checksums, unfinished migrations, and duplicate active entries are rejected without changing history. Cleanup removes only that generated schema.

Record PATCH tests invoke the actual route and cover omission, explicit null, nested detail merges, empty patches, invalid/managed fields, wrong-pet scope, schedule removal and reopening, and concurrent edits/completion. The rules are documented in [RFC 001](rfcs/001-architecture.md).

## Coverage sweep

Added 41 unit cases, seven database/API workflows, and one browser workflow; expanded the migration test to cover rejected histories and rollback. A geocoder regression first reproduced the known same-label/different-coordinate ambiguity, then passed after deduplication was changed to compare coordinates as well as the label. Conflicting locations now reach timezone validation instead of silently selecting the first zone.

The test count is not a coverage percentage. The [coverage map](testing.md) ties requirements to tests and distinguishes local automation from pending hosted and cross-browser/manual accessibility checks.
