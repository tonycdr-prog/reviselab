# ReviseLab

ReviseLab is a Carbon-first preprint review workspace that helps researchers review manuscripts like pull requests before submission.

## Workspace layout

- `apps/web`: Next.js App Router application
- `apps/worker`: queue-driven review worker for Supabase + pgmq
- `apps/extension`: WXT Chrome-first Overleaf companion extension
- `packages/core`: shared brand config, review types, and deterministic review engine
- `packages/ui`: shared Carbon wrappers, shared UI recipes, and shared UI styles
- `supabase/migrations`: database schema, RLS, storage, and queue setup

## Quick start

1. Install dependencies with `pnpm install`
2. Run `pnpm dev:live` to start Supabase, GROBID, sync local env files, validate the stack, and run the web app plus worker
3. Open the web URL printed by Next.js and sign in with a local magic link
4. Use Inbucket at `http://127.0.0.1:54324` to open local magic links
5. Optionally run `pnpm dev:extension`

`pnpm dev:services` still starts only Supabase and GROBID for focused backend work. It also syncs `apps/web/.env.local` and `apps/worker/.env.local` from the local Supabase stack without printing secrets. Preview/sample routes still exist under `/preview/*`, but authenticated app routes now expect the live local or remote stack instead of falling back to mock data.

## Hosted Supabase dev mode

When local Docker or slow wifi makes the full local stack painful, point `apps/web/.env.local` and `apps/worker/.env.local` at a hosted Supabase dev project and run:

- `pnpm dev:hosted:check`
- `pnpm dev:hosted`

Hosted mode runs the local web app and local worker against the hosted Supabase project. Run the check command when you want to verify the remote database, buckets, and queues; `pnpm dev:hosted` itself starts the app without blocking on a slow network preflight. LaTeX ZIP parsing works without GROBID. PDF parsing still requires `GROBID_URL` to point at a reachable GROBID service, either local Docker once the image is cached or a hosted parser service later.

For hosted mode, set `DATABASE_URL` to the Supabase **Session pooler** or **Transaction pooler** connection string, not the direct `db.<project>.supabase.co:5432` string. The direct hosted database endpoint can be IPv6-only and fail on networks without working IPv6.

## Guardrails

- Carbon [`llms.txt`](https://carbondesignsystem.com/llms.txt) is the design source of truth.
- Shared UI must come from `@reviselab/ui`, `@reviselab/ui/carbon`, or `@reviselab/ui/icons`.
- Shared brand text comes from `packages/core/src/brand.ts`.
- Repo hygiene, file budgets, and design drift checks run through `pnpm lint`.

## Useful commands

- `pnpm audit:repo`
- `pnpm lint`
- `pnpm clean`
- `pnpm dev:hosted`
- `pnpm dev:hosted:check`
- `pnpm dev:live`
- `pnpm dev:local:sync-env`
- `pnpm dev:services`
- `pnpm dev:stack:check`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:hosted`
- `pnpm test:live`
- `pnpm build`
- `pnpm test:visual`
- `pnpm db:reset`
- `pnpm db:test`
- `pnpm db:types:verify`
