# Novellia Pets

A shared pet-owner medical-record organizer built with Next.js, Astryx, Tailwind, Prisma, and PostgreSQL. Manage pets, typed medical history, reusable care providers, date-only reminders, and clinic appointments.

**Shared demo: use fictional information.** There is no authentication or ownership isolation; visitors can edit the same data. This is an owner organizer, not a clinical audit system or medical-advice tool.

## Run locally

**Fresh-install blocker:** the current scheduling migration sorts before the provider-creation migration it depends on. The sequence below is the intended setup, but a new empty database needs the migration ordering corrected first. Existing upgraded local databases work. See [known limitations](docs/verification.md#known-limitations).

Use Node.js 24 (see `.nvmrc`), npm, and Docker Compose. Run these commands from the repository root:

```sh
npm ci
cp .env.example .env
docker compose up -d
npm run db:migrate
npm run db:seed
npm run dev
```

Open http://localhost:3000. PostgreSQL uses local port 54329 and a named volume, so restarting the app or container preserves data. On PowerShell, replace `cp` with `Copy-Item`. For WSL, enable Docker Desktop integration or run Compose from PowerShell in this repository.

Seeding creates four pets, two providers, and twelve records across three pets. Dates are relative to the seed day; one pet has no records. Repeating the seed preserves edits. The seeded providers have no resolved addresses, so they support date-only reminders until an address is saved.

```sh
npm run db:reset -- --confirm
```

**Reset deletes every pet, medical record, follow-up, and provider in the configured database, then recreates the demo.** It is an explicit local command, never a public endpoint or build step.

## How it works

```text
Server page -> feature service -> Prisma -> PostgreSQL
Client form -> fetch -> API route -> Zod -> feature service -> PostgreSQL
Successful mutation -> toast -> navigation/server refresh
```

Pages call services directly. There is no separate NestJS app, internal HTTP hop for page reads, Redux store, or client query cache.

| Directory        | Responsibility                                                              |
| ---------------- | --------------------------------------------------------------------------- |
| `src/app`        | Dynamic pages and thin API routes                                           |
| `src/components` | Forms, Astryx controls, shared display components                           |
| `src/domain`     | React-free validation, metadata, date and scheduling utilities              |
| `src/server`     | Business rules, provider geocoding, persistence, serialization, HTTP errors |
| `prisma`         | Three-model schema, committed migrations, repeat-safe seed                  |
| `tests`          | Unit, PostgreSQL integration, and browser tests                             |
| `docs`           | Design, ten RFCs, deployment, verification, and interview walkthrough       |

Start with [the design](docs/design.md) and [the request walkthrough](docs/walkthrough.md). [RFC 004](docs/rfcs/004-medical-records.md) explains adding a record type without changing the table structure.

## Product behavior

- Pet CRUD with unknown birthdays and duplicate names supported.
- Vet visits, vaccinations, and medications have strict type-specific JSON schemas.
- Record type and parent pet stay fixed after creation. Pet deletion cascades to its records and follow-ups.
- Records choose a reusable provider; inline creation preserves the record form. Provider names are unique ignoring case and extra whitespace.
- Archive preserves provider links. Permanent deletion requires zero medical-record and follow-up links.
- Phone fields mask while typing and validate U.S. shape on blur/save. Addresses use separate street, suite, city, state, and ZIP fields.
- Search matches pet name/breed or record title/notes/provider name, with URL filters and 20-item pages. JSON details are not searched.
- One follow-up per record, with its own clinic or vet. Date-only reminders and optional timed appointments share completion/reopen actions.
- Rescheduling the date, time, or provider reopens a follow-up. Unrelated edits preserve completion and the original appointment timezone snapshot.

## Dates, appointments, and addresses

Calendar dates are stored as PostgreSQL DATE and serialized as `YYYY-MM-DD`. Date fields keep that format while focused; medical-history lists, tables, and due-date summaries include the year, such as **Sep 20, 2026**.

Completed, added, and updated timestamps are stored as UTC instants and displayed in the browser timezone. Their tooltip includes local time and timezone. Compact completion labels currently omit the year; this is separate from medical-event and due-date formatting.

Enter appointment times as given by the clinic. The form and saved appointment show both **your time** and **clinic time**, including dates and the difference on the appointment date. California 9 AM becomes Phoenix 10 AM in winter and 9 AM in summer. Skipped or repeated daylight-saving hours return a field error instead of guessing.

There is no manually entered timezone field. Saving a complete provider address uses Photon geocoding and geo-tz geographic boundaries to derive it. For existing providers, save their address once before scheduling a time. The address must match street, city, state, and five-digit ZIP; selecting a suggestion helps correct unmatched formatting. Public lookup can be unavailable. Manual entry and date-only reminders still work, but timed appointments require a resolved address.

Appointments become overdue after their exact instant. Date-only reminders use their saved clinic timezone. `APP_TIME_ZONE` (default `America/Phoenix`) defines historical-date validation and is the fallback when a reminder has no resolved timezone. A clinic relocation does not silently move existing appointments. See [RFC 010](docs/rfcs/010-clinic-scheduling.md).

## Styling and code conventions

Astryx owns component styling and behavior. Tailwind CSS v4 handles application layout and custom styling through Astryx's token bridge. Brand tokens live in `src/theme/novellia.ts`; use semantic classes such as `bg-surface`, `text-primary`, and `border-border`. Generated theme assets are ignored. Installation, development startup, and builds generate them; use `npm run theme:build` after editing tokens during development.

ESLint uses Next.js and React recommended/JSX-runtime presets with additional explicit rules, including required braces for control-flow bodies. It does not use the full Airbnb preset. TypeScript supplies prop types. Prettier handles formatting and Tailwind class order; it does not insert control-flow braces.

```sh
npm run lint:fix
npm run format
```

## Checks

```sh
npm run typecheck
npm run lint
npm run format:check
npm test
npm run build
```

Create the dedicated test database once, then migrate it whenever the schema changes:

```sh
docker compose exec db createdb -U novellia novellia_test
cp .env.test.example .env.test
npm run db:test:migrate
npm run test:integration
npx playwright install chromium
npm run test:e2e
```

Integration setup and cleanup refuse destructive operations unless the PostgreSQL database name is exactly `novellia_test`; resources are still closed after failure. Integration tests erase test data. Browser tests create and remove fixtures, with guarded direct database fixtures for fixed timestamps and appointment zones. Never point either suite at a shared hosted demo.

The default browser command starts a test server on port 3001. If using Windows Chromium against WSL, run the application in WSL with `.env.test`, set `PLAYWRIGHT_EXTERNAL_SERVER=1` in the Windows test shell, and optionally set `PLAYWRIGHT_BASE_URL`. The external server must use the test database. Failure screenshots are retained; tracing is off because of an observed local streaming stall. Enable it elsewhere with `npm run test:e2e -- --trace on`.

See [verification](docs/verification.md) for the last completed checks and known gaps. A documentation refresh is not a new test run.

## Deployment

The target is one Next.js Node-runtime app on Vercel with Prisma Postgres. Runtime uses a PostgreSQL TCP connection, `@prisma/adapter-pg`, and a bounded pool attached to Vercel's lifecycle helper. Keep Preview and Production databases separate. Installation/build generates Prisma Client and the Astryx theme; migration, seed, and reset are never automatic build steps.

Follow [the deployment runbook](docs/deployment.md), including timezone dataset packaging and remote persistence checks. **Hosted deployment is not yet verified.** The last provisioning attempt required the account owner's Prisma marketplace terms step.

## Tools, AI, and tradeoffs

OpenAI Codex assisted with planning, implementation, debugging, tests, documentation, and browser review. The owner should rehearse the actual request path and record-type extension before presenting.

Next.js/React provide rendering and the HTTP boundary; Astryx/Tailwind provide UI; Prisma/PostgreSQL provide persistence; Zod validates input; Photon and geo-tz resolve clinic locations; Temporal handles timezone conversion; Vitest, Playwright, and axe provide checks. Photon/OpenStreetMap attribution appears beside address search. Prisma tooling has pinned `deepmerge-ts` and `mysql2` overrides; no MySQL runtime is used. Review these overrides when upgrading.

Accepted limits: last-successful-write-wins edits, one follow-up per record, application-side follow-up classification/sorting for demo scale, and JSON details that are less convenient for SQL reporting. No authentication, uploads, OCR, external notifications, recurrence, clinic-system integrations, or clinical audit trail.

Future authentication must scope every server read and write to an owner/workspace, including provider management and records through their pets. Hiding controls would not secure the API. [Known API limitations](docs/verification.md#known-limitations) are documented separately from intended behavior.
