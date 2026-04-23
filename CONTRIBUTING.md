# Contributing

## Workflow

1. Install dependencies with `pnpm install`.
2. Run `pnpm dev:live` for the full local loop: Supabase, GROBID, env sync, stack check, web, and worker.
3. Use Inbucket at `http://127.0.0.1:54324` for local magic-link sign-in.
4. Run `pnpm dev:hosted` when you want web and worker against a hosted Supabase dev project instead of local Supabase.
5. Use `pnpm dev:services`, `pnpm dev:web`, and `pnpm dev:worker` only when you need focused processes.
6. Before opening a change, run `pnpm check`. Run `pnpm test:visual` when UI changes touch preview routes or shared UI.
7. Run `pnpm test:live` for the local Supabase/GROBID/DB path, or `pnpm test:hosted` for hosted Supabase validation.
8. Run `pnpm clean` if the workspace has local build artifacts you do not want to keep around.
9. Run `pnpm audit:repo` when you want the full repo guardrail and hygiene sweep in one command.

## Repo hygiene

- Keep shared UI in `packages/ui` and shared business types in `packages/core`.
- Do not commit generated outputs, caches, `*.tsbuildinfo`, or local environment files.
- Let `pnpm dev:local:sync-env` generate local env files; it backs up remote-looking env files without printing secrets.
- Keep hosted Supabase credentials in ignored env files only, and use a dev/staging project rather than production for daily development.
- Use a hosted Supabase pooler connection string for `DATABASE_URL`; avoid direct `db.<project>.supabase.co:5432` URLs on networks without reliable IPv6.
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
