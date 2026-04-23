# Contributing

## Workflow

1. Install dependencies with `pnpm install`.
2. Run `pnpm dev:services` to start the local Supabase stack and the local GROBID service.
3. Copy `apps/web/.env.example` to `apps/web/.env.local`, then fill it from `supabase status -o env`.
4. Copy `apps/worker/.env.example` to `apps/worker/.env`, then copy the same database and Supabase values plus `GROBID_URL=http://127.0.0.1:8070`.
5. Run `pnpm dev:stack:check` before treating the local stack as the source of truth for live flows.
6. Run `pnpm dev:web` for the app, `pnpm dev:worker` for queue processing, and `pnpm dev:extension` for the Overleaf companion.
7. Before opening a change, run `pnpm check`. Run `pnpm test:visual` when UI changes touch preview routes or shared UI.
8. Run `pnpm clean` if the workspace has local build artifacts you do not want to keep around.
9. Run `pnpm audit:repo` when you want the full repo guardrail and hygiene sweep in one command.

## Repo hygiene

- Keep shared UI in `packages/ui` and shared business types in `packages/core`.
- Do not commit generated outputs, caches, `*.tsbuildinfo`, or local environment files.
- Use kebab-case for filenames, named exports by default, and keep files within the documented budget unless they are allowlisted.
- Add new reusable page patterns to `packages/ui` or `docs/design-governance.md`, not ad hoc in app code.

## Supabase

- Put schema changes in `supabase/migrations`.
- Use `supabase/seed.sql` for repeatable local seed data.
- Add DB assertions to `supabase/tests/database`.
- Regenerate or update `packages/core/src/generated/database.types.ts` whenever the schema changes.
- Use Inbucket at `http://127.0.0.1:54324` for local magic-link sign-in testing.

## Security

- Never expose service-role keys to browser code.
- Keep secrets out of committed files, URLs, screenshots, and issue reports.
- Report security concerns through the process documented in `.github/SECURITY.md`.
