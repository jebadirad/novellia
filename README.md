# Novellia Pets

A pet owner's medical-record organizer built with Next.js, Astryx, Prisma, and PostgreSQL. Manage pets, maintain typed medical records, search their history, and track follow-ups.

This is a shared, unauthenticated demonstration. Use fictional information. Visitors can edit the same records.

## Run locally

Prerequisites: Node.js 24 (see `.nvmrc`), npm, and Docker with Compose.

```sh
npm ci
cp .env.example .env
docker compose up -d
npm run db:migrate
npm run db:seed
npm run dev
```

Open http://localhost:3000. The database uses port 54329 and a named Docker volume; it survives app and container restarts.

On Windows, use PowerShell's `Copy-Item .env.example .env`. If using WSL, enable Docker Desktop's WSL integration or run the Docker commands from PowerShell in this repository.

Seeding creates four pets and twelve records, including one pet without history and examples of every follow-up state. Repeating the seed preserves edits to existing seeded entries. The explicit destructive reset is:

```sh
npm run db:reset -- --confirm
```

That command deletes **every pet and record in the configured database**. It is not exposed through the website.

## Architecture

```text
Page (Server Component) -> feature service -> Prisma -> PostgreSQL
Form (Client Component) -> fetch -> API Route Handler -> Zod -> feature service
```

Server-rendered pages call services directly. Mutations use JSON endpoints. There is no internal HTTP call for page reads, no separate NestJS service, and no client-state framework.

- `src/domain`: React-free schemas, types, calendar dates, and record metadata.
- `src/server`: services, database client, serializers, and HTTP error handling.
- `src/components`: explicit forms, type-specific fields, reusable screen pieces.
- `src/app`: pages and thin API routes.
- `prisma`: data model, migration history, repeat-safe seed.
- `docs`: design document, eight feature RFCs, deployment and interview guides.

Start with [the design document](docs/design.md), then [the code walkthrough](docs/walkthrough.md).

## Styling

Astryx owns the UI components; Tailwind CSS v4 owns application layouts and custom styling. Both use the same design tokens through Astryx's official Tailwind bridge.

- Change brand values in `src/theme/novellia.ts`, which extends Astryx's neutral theme.
- Use semantic utilities such as `bg-surface`, `text-primary`, `border-border`, and `rounded-lg` in JSX.
- Use Astryx component props such as `variant="primary"` and `size="lg"` for built-in appearance.
- Use responsive utilities for layout and extract repeated UI into React components.
- Run `npm run theme:build` after editing theme values; startup, installation, and production builds also run it automatically.

The generated theme provides styling on the initial server-rendered page. `globals.css` contains the cascade order, Astryx token bridge, a few app-specific token aliases, and base rules. CSS Modules and application inline style objects have been removed. Prettier sorts Tailwind classes automatically.

## Important behavior

- Three record types: vet visit, vaccination, medication.
- Each record can have one manually scheduled follow-up.
- Completing a follow-up does not change the medical event.
- Changing its due date reopens it; editing unrelated fields preserves completion.
- A pet deletion cascades to only that pet's records.
- Search matches pet name/breed or record title/notes/provider; it does not search JSON details.
- Calendar dates stay `YYYY-MM-DD`; the configured timezone determines today. Default: `America/Phoenix`.
- No medical recommendations or inferred health scores.

## Checks

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run format:check
```

Create a dedicated test database once:

```sh
docker compose exec db createdb -U novellia novellia_test
cp .env.test.example .env.test
npm run db:test:migrate
npm run test:integration
npx playwright install chromium
npm run test:e2e
```

Integration tests refuse to erase a database unless its name is exactly `novellia_test`. Browser tests create and remove their own fixtures and run against the test environment on port 3001. Do not run tests against a shared hosted demo.

For Windows browser tests with the server already running in WSL, set `PLAYWRIGHT_EXTERNAL_SERVER=1` and run the Playwright CLI with Windows Node. Older Ubuntu distributions may not support the current Chromium binary; the application itself has no browser OS dependency.

Failure screenshots are retained. Tracing is off by default because the local Windows/WSL setup stalled streamed pages with the recorder enabled; use `npm run test:e2e -- --trace on` to enable it in another environment.

## Deploy to Vercel

Use Prisma Postgres with a pooled PostgreSQL connection for `DATABASE_URL`. Keep a separate migration connection in `DIRECT_URL`. Runtime connections use `@prisma/adapter-pg`, a bounded pg pool, and Vercel's pool lifecycle helper.

Follow [the deployment runbook](docs/deployment.md). Preview and Production must use different databases. Builds generate Prisma Client but never seed, reset, or automatically migrate the hosted database.

## Care providers

Records select a reusable vet or clinic, or create one in a dialog without leaving the record form. Manage names, contact details, and archived entries under Providers. Archive keeps all historical links; permanent deletion is only allowed without linked records. Provider names are unique ignoring case and extra whitespace.

Run `npm run db:migrate` before starting this version against an existing database. The migrations preserve legacy provider names and record links. See [RFC 009](docs/rfcs/009-care-providers.md) for the data model and request paths.

## Add a record type

See [RFC 004](docs/rfcs/004-medical-records.md) and [the extension exercise](docs/walkthrough.md#extension-rehearsal). Shared columns live in PostgreSQL; type-specific JSON is checked by a Zod discriminated union. UI field and detail maps are exhaustive.

## Tools and AI

OpenAI Codex assisted with planning, implementation, debugging, tests, documentation, and browser review. The owner should review the request paths and rehearse an extension before the interview.

Next.js and React provide the UI/server boundary. Astryx provides accessible component behavior and theme tokens. Prisma makes persistence explicit, PostgreSQL works locally and on Vercel, and Zod validates untrusted inputs. Vitest, Playwright, and axe check business rules, real browser behavior, and automated accessibility rules.

Two transitive dependency overrides (`deepmerge-ts`, `mysql2`) select patched releases used by Prisma tooling. They are locked and must be rechecked when upgrading Prisma. No MySQL runtime is used.

## Deliberate limits

No authentication, ownership isolation, uploads, OCR, clinic integrations, external notifications, or clinical audit trail. Concurrent edits are last successful write wins. JSON details trade SQL reporting convenience for easy record-type extension. A public demo is not suitable for real medical or owner information.

Future authentication would add an owner identity and ownership on pets, migrate existing demo data deliberately, and require an authenticated owner scope in every service read and write. Record access must inherit the pet's ownership check. Filtering the interface alone would not secure the API.

See [verification and remaining deployment work](docs/verification.md) for checks actually performed and the provider setup still required.
