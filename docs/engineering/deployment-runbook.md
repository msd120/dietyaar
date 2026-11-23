# Deployment runbook and OPS-01 evidence

Status: local rehearsal complete 2026-11-23; external deployment not started.

This runbook records the safe, locally verified part of `OPS-01`. It does not authorize or claim verification of Darkube, Supabase, public DNS, TLS/pooler behavior, backups, or production recovery.

## Immutable image commands

The same non-root image exposes three deliberately separate commands:

| Mode            | Command                  | Local evidence                                                                                                               |
| --------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| Web             | `./docker-entrypoint.sh` | Started as `nextjs`; Docker health became healthy and `/api/health` returned 200 with database `ok`                          |
| Migration       | `./docker-migrate.sh`    | Found all 13 committed migrations and reported no pending migrations on local PostgreSQL                                     |
| Optional worker | `./docker-worker.sh`     | Failed closed when disabled; with `WORKER_ENABLED=true`, logged `Worker ready` and connected to local PostgreSQL as `nextjs` |

Web startup never runs Prisma migrations. A release must run the migration command once before starting or gradually replacing web replicas. `DIRECT_URL` must be set explicitly; the local migration script only falls back to the already explicit `DATABASE_URL` so a missing value cannot inherit an unrelated developer URL.

## Local rehearsal commands

Use an immutable image tag in a real release. `dietyaar-local:latest` is only the Compose convenience tag.

```sh
docker build --build-arg NODE_IMAGE=public.ecr.aws/docker/library/node:24.22.1-slim -t dietyaar-local:ops-rehearsal .
docker compose --profile ops run --rm migrate
docker compose up -d web
docker compose --profile enhanced up -d worker
```

Core mode does not start the `enhanced` profile. AI and media-provider flags remain disabled unless their separate provider, consent, quota, and release gates pass.

## Release order

1. Build once and record the image digest.
2. Confirm required secrets and URLs through the platform secret store; never bake them into the image or logs.
3. Run the migration command as a one-off job and stop on any failure.
4. Start one web replica and wait for readiness and database health.
5. Exercise registration/login and one owner-scoped read/write smoke journey.
6. Replace remaining replicas gradually only after logs and probes stay healthy.
7. Start the optional worker only when enhanced-mode flags and provider gates are approved.

## Rollback and recovery boundary

- Application rollback means redeploying the previously recorded image digest. It must not run a down migration.
- Database changes use forward fixes. Before an irreversible migration, require an independently verified export/backup and a tested restore target.
- A failed new replica must be removed from traffic while the previous healthy image remains active.
- Supabase Free pause, export, restore, pooler/TLS/DNS, latency, and Darkube rollback behavior remain unverified external gates.
- No RPO or RTO is promised. Recovery is best effort until a paid/verified backup and restore policy is approved and exercised.

## Timestamped local checklist

| Check                                      | Result on 2026-11-23                              |
| ------------------------------------------ | ------------------------------------------------- |
| Production image build                     | Pass, Next.js 16.4.6                              |
| Runtime user                               | Pass, `nextjs`                                    |
| One-off migration                          | Pass, 13 migrations, none pending                 |
| Web health/readiness                       | Pass, healthy and HTTP 200                        |
| Web restart                                | Pass, returned healthy and HTTP 200               |
| Migration absent from web logs             | Pass                                              |
| Worker disabled guard                      | Pass, exited 1 with explicit message              |
| Worker enabled startup                     | Pass, ready log plus Prisma connection            |
| Temporary containers cleaned               | Pass; only local `db` and `db-test` remained      |
| Darkube/Supabase connectivity and rollback | Not run; requires explicit external authorization |
