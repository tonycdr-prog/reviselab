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
2. Run `pnpm dev:services` to start the local Supabase stack and the local GROBID service
3. Copy the values from `supabase status -o env` into `apps/web/.env.local`
4. Copy the same database and Supabase values into `apps/worker/.env`, and keep `GROBID_URL=http://127.0.0.1:8070`
5. Run `pnpm dev:stack:check`
6. Run `pnpm dev:web`
7. Run `pnpm dev:worker`
8. Optionally run `pnpm dev:extension`

Local magic links are delivered to Inbucket at `http://127.0.0.1:54324`. Preview/sample routes still exist under `/preview/*`, but authenticated app routes now expect the live local or remote stack instead of falling back to mock data.

## Guardrails

- Carbon [`llms.txt`](https://carbondesignsystem.com/llms.txt) is the design source of truth.
- Shared UI must come from `@reviselab/ui`, `@reviselab/ui/carbon`, or `@reviselab/ui/icons`.
- Shared brand text comes from `packages/core/src/brand.ts`.
- Repo hygiene, file budgets, and design drift checks run through `pnpm lint`.

## Useful commands

- `pnpm audit:repo`
- `pnpm lint`
- `pnpm clean`
- `pnpm dev:services`
- `pnpm dev:stack:check`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm test:visual`
- `pnpm db:reset`
- `pnpm db:test`
- `pnpm db:types:verify`
