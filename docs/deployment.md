# Deploying Novellia Pets to Vercel

Use `npm run db:migrate` for both fresh databases and upgrades. It reconciles the earlier scheduling migration name before applying pending migrations.

## Provision

Project `novellia-pets` is deployed under `jebadirads-projects` at https://novellia-pets.vercel.app. Separate free Prisma Postgres resources `novellia-production` and `novellia-preview` are connected only to their matching environments. Both use iad1. Local development still uses Docker PostgreSQL.

The Prisma marketplace terms were accepted by the account owner. Browser and CLI must use the same Vercel account; the terms link returns 404 when opened under the wrong account.

## Environment variables

Set these separately for Production and Preview:

| Variable      | Value                                                                        |
| ------------- | ---------------------------------------------------------------------------- |
| DATABASE_URL  | Provider's pooled postgresql connection URL                                  |
| DIRECT_URL    | Provider's direct PostgreSQL URL for migrations                              |
| APP_TIME_ZONE | America/Phoenix: historical-date validation and unresolved reminder fallback |

Use the provider's PostgreSQL TCP URLs for the pg adapter. A prisma:// Accelerate URL is not interchangeable with a pg connection URL.

Do not put credentials in source control, public variables, screenshots, or README examples. Keep local .env pointed at local PostgreSQL.

## Release sequence

1. Install with npm ci and run local checks.
2. Pull the intended environment into an ignored environment file or configure its variables in a trusted shell.
3. Confirm the target database and run npm run db:migrate with its DIRECT_URL.
4. Run the seed only when initializing the dedicated demo database.
5. Deploy the Next.js project; npm run build generates Prisma Client.
6. Verify pet and record CRUD, direct-page refresh, provider address resolution, a timed appointment viewed from a different browser timezone, and completion/reopen.
7. Redeploy and confirm a temporary smoke-test row survives, then remove only that row.

Do not run seed or reset in the Vercel build command. Do not connect preview builds to the production database.

## Runtime

All database routes run in Node.js. The database module creates a pg pool with max 5, 5-second idle timeout, and 10-second connection timeout. Vercel's attachDatabasePool releases idle connections around function suspension. Prisma uses @prisma/adapter-pg.

Pages read dynamically. Pages do not query the database during prerendering; valid server environment configuration is required for generation and runtime. DATABASE_URL is required when serving database-backed pages.

## Clinic timezone data

`next.config.ts` externalizes geo-tz and explicitly traces its required `timezones-1970` boundary files into provider API functions. Unused geographic datasets are excluded. These are read-only package assets, not persistent runtime storage. Keep this configuration when changing build tooling, and inspect the deployed function artifacts or exercise a real address-to-timezone save after release.

Photon address lookup requires outbound HTTPS and may time out or throttle. No API key is configured. Unresolved addresses still save, but timed appointments remain blocked until resolution succeeds. Existing providers resolve when a complete address is saved; migrations and seeds do not geocode them.

## Rollback

Vercel can roll back application code, but rolling back a deployment does not undo database migrations. Prefer additive schema changes and keep the old application compatible during a release. Back up data and plan a separate migration when a destructive schema change becomes necessary.

## References

- [Prisma ORM 7 on Vercel](https://www.prisma.io/docs/orm/v7/prisma-client/deployment/serverless/deploy-to-vercel)
- [Vercel SQLite storage limitations](https://vercel.com/kb/guide/is-sqlite-supported-in-vercel)

Live deployment evidence is recorded in verification.md. GitHub authentication and the repository connection are established. Vercel is connected to `jebadirad/novellia`, with `main` as the production branch and automatic Git deployments enabled. Other branches use Preview. Direct deployment remains available with `npx vercel deploy --prod --yes`. A post-connection Git-triggered deployment has not yet been exercised.

## Migration history upgrade

The scheduling migration was renamed from `20260920180000_clinic_scheduling` to `20260920230000_clinic_scheduling` so provider creation and address changes precede it. Its SQL is unchanged. A new migration removes an unintended CareProvider.updatedAt database default to match the Prisma schema.

Always run `npm run db:migrate` before `npm run db:dev` on an existing checkout. The wrapper uses DIRECT_URL when supplied, otherwise DATABASE_URL. Fresh databases need no reconciliation. For an existing successfully applied old migration, it checks the exact SQL checksum and absence of conflicting history, then changes only that ledger entry's name in a transaction. It does not rerun the SQL or reset application data. It then invokes Prisma migrate deploy. Repeating the command is safe.

A failed, modified, or duplicate active entry stops the command without changing history. Inspect the target database and Prisma migration status before repairing such a history; do not reset data or mark migrations applied merely to bypass the error. For a failed old scheduling migration on a clean database, confirm its SQL made no changes before using Prisma migrate resolve --rolled-back with the old name, then rerun npm run db:migrate. The old first statement failed when CareProvider did not exist, but inspect the actual failure rather than assuming this applies to every database.

## Current project commands

The committed vercel.json pins Next.js, npm ci, npm run build, and iad1; package.json selects Node 24. Secrets and local artifacts are excluded by .vercelignore. Migrations and seeds never run during a deployment build.

Pull each environment into its own ignored file:

```sh
npx vercel env pull .env.vercel-production --environment production --yes
npx vercel env pull .env.vercel-preview --environment preview --yes
```

Vercel redacts custom Secret values during env pull. For the currently provisioned Prisma Postgres databases, the integration-provided DATABASE_URL is the PostgreSQL TCP connection used for both runtime and migrations. Explicitly set DIRECT_URL from that pulled DATABASE_URL in the migration process so neither a redacted placeholder nor the local .env can select the wrong database:

```sh
node --env-file=.env.vercel-production --import tsx -e "process.env.DIRECT_URL = process.env.DATABASE_URL; import('./scripts/migrate.ts')"
```

Use the preview file instead for Preview. Inspect the target environment before running. Keep both downloaded files ignored and private. Repeated migrations are safe; only initialize a new dedicated demo database with the seed.
