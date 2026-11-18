# Database migration and integration-test procedure

Dietyaar uses reviewed, committed, forward-only Prisma migrations. Never use
`prisma db push`, `prisma migrate reset`, or a production database for tests.

## Local integration run

1. Start the disposable PostgreSQL service with `npm run db:test:up`.
2. Copy the documented `TEST_DATABASE_URL` from `.env.example` into the shell or
   local `.env`.
3. Run `npm run test:integration`.

The harness validates `TEST_DATABASE_URL` before invoking Prisma. It never falls
back to `DATABASE_URL`, requires a database name with a standalone `test` marker,
and restricts non-CI runs to local or Compose hosts. Migrations run through
`prisma migrate deploy`; integration tests run serially and clean up through
transactions or temporary tables.

## Creating and reviewing migrations

- Change `prisma/schema.prisma` in the owning feature task.
- Generate a named migration against a disposable development database.
- Review the generated SQL, especially constraints, indexes, foreign-key
  actions, nullable fields, and destructive warnings.
- Commit both the schema and migration. Rehearse `npm run test:integration` on a
  fresh disposable database before merging.

Application replicas do not create migrations. Deployment runs
`npm run db:deploy` as a separate one-off step before starting or promoting web
and worker replicas.

## Rollback policy

Applied migrations are not edited or rolled back destructively. Correct a bad
migration with a new forward migration that restores compatibility. If a deploy
must be stopped, roll the application back only when the previous version is
compatible with the already-applied schema; otherwise deploy the forward fix
first. Production restore is an operational recovery action, not a routine
migration rollback.
