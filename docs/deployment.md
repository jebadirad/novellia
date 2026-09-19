# Deploying Novellia Pets to Vercel

## Provision

Create a Vercel project named novellia-pets and two Prisma Postgres databases: one Production and one Preview. The Prisma marketplace free plan is sufficient for the demonstration's initial setup; verify your account's current limits.

Prisma's marketplace integration may require the account owner to accept its terms in a browser. The CLI cannot complete provisioning until that step is done.

## Environment variables

Set these separately for Production and Preview:

| Variable      | Value                                           |
| ------------- | ----------------------------------------------- |
| DATABASE_URL  | Provider's pooled postgresql connection URL     |
| DIRECT_URL    | Provider's direct PostgreSQL URL for migrations |
| APP_TIME_ZONE | America/Phoenix                                 |

Use the provider's PostgreSQL TCP URLs for the pg adapter. A prisma:// Accelerate URL is not interchangeable with a pg connection URL.

Do not put credentials in source control, public variables, screenshots, or README examples. Keep local .env pointed at local PostgreSQL.

## Release sequence

1. Install with npm ci and run local checks.
2. Pull the intended environment into an ignored environment file or configure its variables in a trusted shell.
3. Confirm the target database and run prisma migrate deploy with its DIRECT_URL.
4. Run the seed only when initializing the dedicated demo database.
5. Deploy the Next.js project; npm run build generates Prisma Client.
6. Verify pet creation, record creation, edit, refresh, follow-up completion, and deletion.
7. Redeploy and confirm a temporary smoke-test row survives, then remove only that row.

Do not run seed or reset in the Vercel build command. Do not connect preview builds to the production database.

## Runtime

All database routes run in Node.js. The database module creates a pg pool with max 5, 5-second idle timeout, and 10-second connection timeout. Vercel's attachDatabasePool releases idle connections around function suspension. Prisma uses @prisma/adapter-pg.

Pages read dynamically. Database access is not required to prerender pages during build; DATABASE_URL is required when serving them.

## Rollback

Vercel can roll back application code, but rolling back a deployment does not undo database migrations. Prefer additive schema changes and keep the old application compatible during a release. Back up data and plan a separate migration when a destructive schema change becomes necessary.

## References

- [Prisma ORM 7 on Vercel](https://www.prisma.io/docs/orm/v7/prisma-client/deployment/serverless/deploy-to-vercel)
- [Vercel SQLite storage limitations](https://vercel.com/kb/guide/is-sqlite-supported-in-vercel)

Actual live deployment evidence and remaining account setup are recorded in verification.md.
