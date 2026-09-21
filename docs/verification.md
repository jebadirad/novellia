# Verification and remaining work

## Evidence as of September 20, 2026

This records checks completed during implementation, not a guarantee about every later revision. The documentation refresh reviewed code and documentation consistency; it did not rerun application suites or hosted provisioning.

| Check                   | Latest recorded result                                                                                                                                            |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit tests              | 43 passed after clinic scheduling and the year-inclusive calendar-date change                                                                                     |
| PostgreSQL integration  | 4 passed after clinic scheduling: CRUD, providers, scheduling snapshots/transitions, search, cascade isolation, seed and dashboard consistency                    |
| Browser tests           | 24 passed against the production build after clinic scheduling; includes search races, timestamp zones, desktop/mobile appointments, provider and phone workflows |
| Build                   | Production build passed after scheduling; dynamic pages/routes retained                                                                                           |
| Static checks           | Lint, typecheck, and formatting passed after the year-inclusive calendar-date change                                                                              |
| Accessibility           | Automated axe checks and exercised keyboard/dialog/form workflows passed; not a complete manual accessibility audit                                               |
| Responsive behavior     | Workflow checks at 375, 768, and 1440 pixels; appointment details visually reviewed on desktop/mobile                                                             |
| Real address resolution | Application lookup and a temporary test provider resolved a public address to America/New_York; the fixture was removed                                           |
| Deployment assets       | Build traces include geo-tz's required 1970 boundary data and exclude unused datasets                                                                             |

The final browser run preceded the one-line change adding years to compact calendar dates. That change received static checks and all 43 unit tests, not another full browser/build run. Dependency audits previously reported no known vulnerabilities; no fresh audit was run for this documentation edit.

Earlier local checks verified clean installation, app-restart persistence, and provider/address migrations without resetting existing records. These are historical local checks, not remote deployment proof. Screenshots and temporary evidence live in ignored `artifacts/` and test-output directories.

## Test environment and safety

Local development uses Docker PostgreSQL with a named volume. Integration and browser checks use `novellia_test`. `tests/database-lifecycle.ts` checks the PostgreSQL URL and exact database name before deletion, prevents cleanup deletion after rejected setup, and closes Prisma/pool resources even on failure. Direct browser database fixtures also invoke the guard. External browser-server configuration remains the operator's responsibility: its API must point to the same dedicated test database.

Windows Chromium was used against WSL. The older Ubuntu distribution could not run the installed Linux Chromium. Tracing is off by default after observed streamed-page stalls with recording enabled; occasional initial-load stalls were also observed earlier. Their root cause is unconfirmed. The latest complete 24-test run passed without retries.

## Hosted deployment remains pending

The last recorded Vercel CLI provisioning attempt stopped at Prisma marketplace terms acceptance. This refresh did not inspect account state. No live deployment, hosted CRUD, or persistence across Vercel redeployment is claimed verified.

Complete the account step, provision separate Preview/Production databases, then follow [deployment.md](deployment.md). Validate the deployed address-to-timezone flow as well as CRUD and persistence. Local database survival and packaged build assets do not replace remote checks.

## Known limitations

- **Fresh-database migration ordering:** `20260920180000_clinic_scheduling` alters CareProvider and reads providerId, but sorts before `20260920210000_care_providers`, which creates them. The initial migration contains neither. Static inspection establishes that a fresh sequential migration would fail; this refresh did not run migrations against an empty database. The existing local databases succeeded because providers were already applied before scheduling was added. Correct the ordering with an explicit plan for already-applied migration history, then verify empty-database setup before hosted provisioning. Do not reset an existing database to work around this.

- **Partial record PATCH and scheduling:** `src/app/api/pets/[petId]/records/[recordId]/route.ts` merges existing common fields but currently omits `followUpProviderId` and `followUpTime` from that merge. A partial update that leaves them out on a linked follow-up can fail with a provider validation error. The application form sends both fields, so its save path works. API callers should include both current values until the merge is corrected. This gap was found during documentation review and is not fixed by this documentation-only change.
- **Unresolved clinic location:** date-only reminders remain available and use APP_TIME_ZONE when no timezone snapshot exists. Timed creation/rescheduling requires a resolved address. Existing clinics resolve when their address is saved, not during migration.
- **DST overlaps/gaps:** invalid or ambiguous local times are rejected; there is no UI for choosing between two occurrences of the repeated hour.
- **Time-sensitive status:** status is recomputed on server reads/refresh, not by a continuously running client clock.
- **Compact completion labels:** use the browser timezone but omit the year. Medical-history event dates and follow-up due dates include it.
- **Development warning:** Astryx 0.6.2 DateInput was observed forwarding nativePicker to a DOM element, producing a React warning. No package internals are patched. Recheck when upgrading.
- **Scale and ownership:** shared unauthenticated data, last successful write wins, application-side open-follow-up classification/sorting, no production clinical audit guarantees.

## Interview handoff

The repository includes a master design, ten RFCs, setup/deployment instructions, and a [request-path walkthrough](walkthrough.md). The owner-led extension rehearsal and Loom recording remain human handoff steps. Describe the app as locally verified and deployment-ready in structure, not as remotely deployed and proven.
