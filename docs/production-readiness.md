# Production readiness

ReviseLab should only use hosted services after the local live path is already
green. Production setup is intentionally explicit so local smoke tests cannot
accidentally hit hosted data.

## Required hosted services

- Supabase project with Auth, Postgres, private storage buckets, `pgmq`,
  `pg_cron`, and `pgvector`.
- Private `paper-sources` and `paper-artifacts` buckets with RLS-backed access
  through the app and service-role-only worker writes.
- A worker runtime with `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`,
  `SUPABASE_SERVICE_ROLE_KEY`, and `GROBID_URL`.
- A GROBID service reachable from the worker. The web app never talks to GROBID
  directly. The default deployable config lives in `infra/grobid`.
- Backups, deletion cleanup, and queue retry monitoring before broader beta use.

## Environment rules

- `apps/web/.env.local` and `apps/worker/.env.local` stay local-only and must
  never be committed.
- Hosted `DATABASE_URL` should use the Supabase pooler connection string, not
  the direct `db.<project>.supabase.co:5432` URL.
- The web and worker must point to the same Supabase project and database.
- Service-role access is limited to server, worker, queueing, and storage
  cleanup paths.

## Checks

Run these before production smoke testing:

```sh
pnpm prod:check
pnpm dev:hosted:check
pnpm grobid:check
pnpm test:hosted
```

Run hosted smoke tests only against an intentionally configured hosted project:

```sh
pnpm smoke:hosted
pnpm smoke:hosted:pdf
```

If the hosted GROBID service is intentionally unavailable during setup, use
`pnpm smoke:hosted:pdf:expect-failure` to verify the failure path only. Do not
use that as the production go/no-go.

## Hosted GROBID

- Default image: `grobid/grobid:0.8.2-crf`, matching local development and CI.
- Health check: `GET /api/isalive`.
- Parser endpoint: `POST /api/processFulltextDocument`.
- Initial Fly.io sizing: 2 shared CPUs, 4 GB memory, one always-running
  machine. Increase memory before increasing concurrency if PDF parsing starts
  failing under load.
- Parser downtime is a user-visible `failed-parse` state and retry path. Do not
  reintroduce metadata-only PDF fallback in authenticated/live flows.

## Production go/no-go

- RLS is enabled on every exposed table.
- Uploads create owned papers, versions, and reviews.
- Worker jobs are idempotent and persist user-visible failure states.
- Storage cleanup removes source and artifact objects after deletion.
- Telemetry records upload, parse, review, diff action, and rule-hit events.
- Deterministic checks include rule id, rule version, source URL, checked date,
  evidence, and exact file/anchor targets.
