# Railway deployment

ReviseLab is a pnpm monorepo, so Railway needs explicit commands for each
service. The root `railway.json` is intentionally configured for the web app as
the first Railway service.

## Web service

Use the repository root as the Railway root directory. The tracked
`railway.json` provides:

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
DATABASE_URL=
```

Use the Supabase pooler connection string for `DATABASE_URL`, not the direct
IPv6-only `db.<project>.supabase.co:5432` URL.

## Worker service

Deploy the worker as a separate Railway service from the same repo. Override
the service build/start commands in Railway settings instead of reusing the web
`railway.json`:

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
