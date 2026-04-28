@../RTK.md

# Supabase Agent Contract

## Scope

- This file governs `supabase`, migrations, database tests, snippets, RLS policy changes, storage bucket setup, queue extensions, and local database validation.

## Schema Rules

- Supabase migrations are the database source of truth.
- Keep core table names implementation-oriented unless there is a real product reason to rename them.
- RLS must stay enabled on every exposed table.
- Authorization must be database-driven, not `user_metadata`-driven.
- Do not weaken RLS to make tests pass. Fix policies or test setup.
- Prefer additive migrations with explicit backfill/rollback notes when changing production data shape.

## Required Tables And Concepts

- Preserve core tables unless deliberately migrated: `profiles`, `workspaces`, `workspace_members`, `papers`, `paper_versions`, `reviews`, `review_checks`, `review_suggestions`, `review_comments`, `review_files`, `review_events`, `extension_installations`, `usage_events`, and `arxiv_categories`.
- Review suggestions must preserve origin, explainability, workflow status, anchors, edited text, linked checks/comments, and timestamps.
- Review checks must preserve rule metadata, source URLs, source checked dates, evidence, targets, and linked suggestions.
- Review events must support lifecycle and user action history.

## Storage And Queues

- Immutable uploads belong in private `paper-sources`.
- Derived outputs belong in private `paper-artifacts`.
- Use standard uploads for small files and TUS/resumable uploads for larger files where implemented.
- Queues must support idempotent parse/review processing.
- Cleanup jobs must handle storage artifacts and database rows asynchronously and safely.

## Environment And Secrets

- Never commit Supabase tokens, service-role keys, database URLs with passwords, JWT secrets, or local `.env` files.
- Use local Supabase for development validation when available.
- Production database URLs and service-role keys belong only in deployment environment variables.

## Tests And Validation

- Add database tests for RLS, ownership, migrations, queue state, and storage policy changes.
- Run `pnpm db:reset`, `pnpm db:test`, and `pnpm db:types:verify` when Supabase schema changes.
- If local Supabase CLI is unavailable, state that explicitly and run the strongest available fallback.

## File Hygiene

- One migration should do one coherent schema change.
- Name migrations descriptively.
- Keep SQL snippets out of migrations unless they are intended to run.
