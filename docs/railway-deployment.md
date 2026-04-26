# Railway deployment

ReviseLab is a pnpm monorepo, so Railway needs explicit commands for each
service. The root `railway.json` is intentionally configured for the web app as
the first Railway service.

## Web service

Use the repository root as the Railway root directory. The tracked
`railway.json` dispatches by `RAILWAY_SERVICE_NAME` and runs the web commands
for the `reviselab` service:

```sh
pnpm --filter @reviselab/web build
pnpm --filter @reviselab/web start
```

The web start script binds Next.js to `0.0.0.0` and Railway's `PORT`, which is
required for public traffic.

Required variables:

```sh
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
REVISELAB_SITE_URL=https://reviselab-production.up.railway.app
REVISELAB_DIAGNOSTICS_ENABLED=false
REVISELAB_ADMIN_EMAILS=
DATABASE_URL=
GROBID_URL=
```

Use the Supabase pooler connection string for `DATABASE_URL`, not the direct
IPv6-only `db.<project>.supabase.co:5432` URL.

`REVISELAB_SITE_URL` is required for auth. Magic-link and OAuth callbacks use
this value instead of Railway's internal request origin, which prevents email
links from being generated with internal hosts such as `0.0.0.0`.

Keep `REVISELAB_DIAGNOSTICS_ENABLED=false` in production unless actively
debugging. When it is not `true`, `/settings/diagnostics` returns a 404 and the
Diagnostics nav item is hidden from signed-in users.

Set `REVISELAB_ADMIN_EMAILS` to a comma-separated list of trusted operator
emails. Those users can access `/admin/platform`, which shows private stack
health, worker heartbeat freshness, queue depth, failure counts, and recent
parse/review failures.

## Worker service

Deploy the worker as a separate Railway service from the same repo. Name the
service `reviselab-worker`; the tracked `railway.json` dispatches to the worker
commands when `RAILWAY_SERVICE_NAME` contains `worker`:

```sh
pnpm --filter @reviselab/worker build
pnpm --filter @reviselab/worker start
```

Required variables:

```sh
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
GROBID_URL=
```

## GROBID service

Deploy GROBID as a separate Docker image service, not as part of the web app:

```txt
Image: grobid/grobid:0.8.2-crf
Port: 8070
Health check: /api/isalive
Env: JAVA_TOOL_OPTIONS=-XX:-UseContainerSupport
Memory: 4 GB minimum recommended
```

Set the worker's `GROBID_URL` to the GROBID service URL after it is deployed.
