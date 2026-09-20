# Verification and remaining deployment work

Verified locally on September 18, 2026. This file distinguishes local evidence from hosted deployment, which is still pending.

## Tailwind migration — September 19, 2026

Replaced the application CSS Module and inline style objects with Tailwind CSS v4 utilities. Astryx components keep their native variants and theme styling. The custom theme in `src/theme/novellia.ts` is compiled for SSR, and Astryx's official Tailwind bridge exposes its colors, typography, spacing, and radii to application utilities. Additional avatar and decorative tokens are defined in the same theme.

The production build, TypeScript, lint, formatting, and all 15 Playwright tests passed after conversion. Populated desktop and mobile screens passed axe checks and were visually reviewed; workflow layout checks covered 375, 768, and 1440 pixels. The theme build's `--check` verified that generated artifacts match their source. No CSS Module imports, component stylesheets, raw color values in JSX, or application `style` props remain. `npm audit` reported zero known vulnerabilities.

## Completed

| Check                   | Evidence                                                                                                                                                                                                                                                                                                 |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dependency installation | Clean `npm ci` completed and generated Prisma Client.                                                                                                                                                                                                                                                    |
| Production build        | `npm run build` passed; database pages and API routes are dynamic.                                                                                                                                                                                                                                       |
| Type safety and lint    | `npm run typecheck` and `npm run lint` passed.                                                                                                                                                                                                                                                           |
| Domain tests            | 14 tests cover provider validation, normalization, record links, and existing validation, calendar dates, and follow-up boundaries.                                                                                                                                                                      |
| PostgreSQL integration  | Three database workflow tests cover CRUD, isolation, cascade deletion, filters, pagination, completion transitions, dashboard counts, and repeat-safe seeds.                                                                                                                                             |
| Browser workflows       | 15 Playwright tests cover all three record types, pet CRUD, failed and pending saves, dirty navigation, query state, invalid requests, responsive layout, and accessibility.                                                                                                                             |
| Responsive review       | Main workflows checked at 375, 768, and 1440 pixels. Populated mobile and desktop pages were also visually reviewed.                                                                                                                                                                                     |
| Accessibility           | Axe WCAG A/AA checks passed on seven core routes; additional checks passed on populated dashboard, pets, records, and follow-ups at desktop and mobile widths. Keyboard submission/navigation, validation focus, and confirmation dialogs were exercised. This is not a full manual accessibility audit. |
| Persistence             | Created a temporary pet through the API, stopped and restarted the production server, read the same pet successfully, and deleted only that temporary row.                                                                                                                                               |
| Dependencies            | `npm audit` reported zero known vulnerabilities at verification time.                                                                                                                                                                                                                                    |

Local application database: Docker PostgreSQL with a named volume. Integration and browser tests use a separate `novellia_test` database. Screenshots and temporary verification files live in ignored `artifacts/`; they are not application dependencies.

The tests run Chromium on Windows against the application running in WSL. The older local Ubuntu version could not run Playwright's current Linux Chromium build. The README documents this environment-specific workaround.

Playwright trace recording also reproduced a streamed-page stall in this Windows/WSL setup. Direct browser loads and the same test without the recorder passed. The default suite therefore disables tracing and retains screenshots on failure. This records the observed condition, not a confirmed upstream root cause. Tracing can be enabled explicitly with `--trace on` for diagnosis elsewhere.

## Care-provider verification

Care-provider iteration (September 20): both provider migrations applied locally without resetting data. All 12 existing medical-record IDs and normalized provider names matched the pre-migration snapshot. Migrated providers and record edit pages were checked in the development browser. Provider tests cover failed inline saves, retained record fields, duplicate selection, rename, archive/restore, deletion protection, mobile layout, and dialog accessibility. Accessibility measurements wait for the dialog's opening animation to settle.

## Hosted deployment remains pending

The Vercel CLI authenticated successfully as the existing account. Provisioning the dedicated free-plan Prisma Postgres database stopped at Prisma's marketplace terms requirement. No hosted database or live application deployment has been claimed as verified.

The account owner must complete the provider's terms step. Then follow deployment.md to provision separate Production and Preview databases, configure their environment variables, apply the migration, seed explicitly, deploy, and perform remote CRUD and redeployment-persistence checks.

Local persistence proves the application's database integration; it does not replace those remote checks.

## Known development-only warning

Astryx 0.6.2 forwards the DateInput `nativePicker` property to a DOM element and produces a React unknown-property warning during development. The shared date field uses Astryx’s own picker to preserve YYYY-MM-DD on focus and blur. Labels, validation, production rendering, and automated accessibility checks pass. No package internals are patched; recheck this warning when upgrading Astryx.

## Interview handoff

The design document and eight RFCs describe the implemented behavior. walkthrough.md traces actual files and provides the lab-result extension rehearsal and a suggested Loom sequence. The owner-led rehearsal and Loom recording remain human handoff steps.
