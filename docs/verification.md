# Verification and remaining work

## Evidence as of September 20, 2026

This records checks completed during implementation, not a guarantee about every later revision. The latest migration/PATCH revision passed lint, type checking, 43 unit tests, and 6 PostgreSQL integration tests. Browser and hosted checks were not rerun for this revision.

| Check                   | Latest recorded result                                                                                                                                                                                    |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit tests              | 43 passed after clinic scheduling and the year-inclusive calendar-date change                                                                                                                             |
| PostgreSQL integration  | 6 passed after migration/PATCH fixes, including empty-schema migration replay, schema drift check, history reconciliation, route-level PATCH, concurrent edits/completion, and existing service workflows |
| Browser tests           | 24 passed against the production build after clinic scheduling; includes search races, timestamp zones, desktop/mobile appointments, provider and phone workflows                                         |
| Build                   | Production build passed after scheduling; dynamic pages/routes retained                                                                                                                                   |
| Static checks           | Lint, typecheck, and formatting passed after the year-inclusive calendar-date change                                                                                                                      |
| Accessibility           | Automated axe checks and exercised keyboard/dialog/form workflows passed; not a complete manual accessibility audit                                                                                       |
| Responsive behavior     | Workflow checks at 375, 768, and 1440 pixels; appointment details visually reviewed on desktop/mobile                                                                                                     |
| Real address resolution | Application lookup and a temporary test provider resolved a public address to America/New_York; the fixture was removed                                                                                   |
| Deployment assets       | Build traces include geo-tz's required 1970 boundary data and exclude unused datasets                                                                                                                     |

The final browser run preceded the one-line change adding years to compact calendar dates. That change received static checks and all 43 unit tests, not another full browser/build run. Dependency audits previously reported no known vulnerabilities; no fresh audit was run for this documentation edit.

Earlier local checks verified clean installation, app-restart persistence, and provider/address migrations without resetting existing records. These are historical local checks, not remote deployment proof. Screenshots and temporary evidence live in ignored `artifacts/` and test-output directories.

## Test environment and safety

Local development uses Docker PostgreSQL with a named volume. Integration and browser checks use `novellia_test`. `tests/database-lifecycle.ts` checks the PostgreSQL URL and exact database name before deletion, prevents cleanup deletion after rejected setup, and closes Prisma/pool resources even on failure. Direct browser database fixtures also invoke the guard. External browser-server configuration remains the operator's responsibility: its API must point to the same dedicated test database.

Windows Chromium was used against WSL. The older Ubuntu distribution could not run the installed Linux Chromium. Tracing is off by default after observed streamed-page stalls with recording enabled; occasional initial-load stalls were also observed earlier. Their root cause is unconfirmed. The latest complete 24-test run passed without retries.

## Hosted deployment remains pending

The last recorded Vercel CLI provisioning attempt stopped at Prisma marketplace terms acceptance. This refresh did not inspect account state. No live deployment, hosted CRUD, or persistence across Vercel redeployment is claimed verified.

Complete the account step, provision separate Preview/Production databases, then follow [deployment.md](deployment.md). Validate the deployed address-to-timezone flow as well as CRUD and persistence. Local database survival and packaged build assets do not replace remote checks.

## Known limitations

- **Unresolved clinic location:** date-only reminders remain available and use APP_TIME_ZONE when no timezone snapshot exists. Timed creation/rescheduling requires a resolved address. Existing clinics resolve when their address is saved, not during migration.
- **DST overlaps/gaps:** invalid or ambiguous local times are rejected; there is no UI for choosing between two occurrences of the repeated hour.
- **Time-sensitive status:** status is recomputed on server reads/refresh, not by a continuously running client clock.
- **Compact completion labels:** use the browser timezone but omit the year. Medical-history event dates and follow-up due dates include it.
- **Development warning:** Astryx 0.6.2 DateInput was observed forwarding nativePicker to a DOM element, producing a React warning. No package internals are patched. Recheck when upgrading.
- **Scale and ownership:** shared unauthenticated data, last successful write wins, application-side open-follow-up classification/sorting, no production clinical audit guarantees.

## Interview handoff

The repository includes a master design, ten RFCs, setup/deployment instructions, and a [request-path walkthrough](walkthrough.md). The owner-led extension rehearsal and Loom recording remain human handoff steps. Describe the app as locally verified and deployment-ready in structure, not as remotely deployed and proven.

## Fresh setup and PATCH verification

A separate clean source copy, without node_modules, generated clients, build output, or local environment files, passed npm ci and a production build. Against a newly created disposable PostgreSQL database, npm run db:migrate succeeded twice and npm run db:seed succeeded twice, yielding four pets and twelve records. The disposable database was removed afterward. Existing local development and test databases also upgraded through the guarded history reconciliation without a reset.

The permanent migration test uses a uniquely named empty schema inside the guarded novellia_test database. It invokes the actual migration command, repeats it, compares the resulting schema to schema.prisma, simulates the old applied migration name, and verifies a changed checksum is rejected. Cleanup removes only that generated schema.

Record PATCH tests invoke the actual route and cover omission, explicit null, nested detail merges, empty patches, invalid/managed fields, wrong-pet scope, schedule removal and reopening, and concurrent edits/completion. The rules are documented in [RFC 001](rfcs/001-architecture.md).
