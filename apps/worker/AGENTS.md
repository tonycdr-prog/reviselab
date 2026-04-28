@../../RTK.md

# Worker Agent Contract

## Scope

- This file governs `apps/worker`, the Node worker, queue consumers, parser orchestration, review persistence, and privileged backend jobs.
- The worker is infrastructure. Do not use Carbon, React, browser APIs, or UI components here.

## Architecture Rules

- Use `supabase-js` only where storage/auth API access is needed.
- Use `Kysely` plus `postgres.js` for server-only typed SQL in worker/admin flows.
- Keep service-role access contained to worker/admin paths that require privileged persistence, queueing, or storage operations.
- Queue consumers must be idempotent. Retrying a job must not duplicate papers, versions, files, checks, comments, suggestions, or events.
- Permanent user-facing failures must be persisted before a queue message is archived.
- Infrastructure failures before state is safely persisted should remain retryable.

## Pipeline Rules

- The canonical path is upload, create paper version, enqueue `parse_paper`, parse manuscript, enqueue or resume `run_review`, persist review outputs, update review progress.
- `paper_versions.parse_status` owns parse lifecycle.
- `reviews.status` owns review lifecycle only.
- Parsing must not mark a review as `processing`; `run_review` does that when review execution starts.
- Parse states must map to `ReviewProgress`: parse queued, parsing, review queued, reviewing, failed parse, failed review, and ready.
- PDF parsing depends on GROBID. If GROBID is unavailable in a live PDF path, fail clearly instead of falling back to metadata-only parsing.
- LaTeX ZIP parsing must normalize into the same manuscript structure as PDF parsing.

## Rules Engine

- Deterministic rules are authoritative. AI explanations or suggestions are secondary and must never be the production authority.
- Rule outputs must include stable rule id, version, source URL, source checked date, evidence payload, severity, readiness impact, file target, and anchor when applicable.
- Source/PDF parse failures are blockers or comments/checks, not fake manuscript diffs.
- Do not broaden rules beyond supported source-backed behavior without fixture tests.

## Observability

- Emit or persist lifecycle events for parse started/completed/failed, review started/completed/failed, rule hits, and diff actions.
- Logs must not print secrets, service-role keys, database URLs with credentials, source file contents, or manuscript text beyond redacted identifiers.
- Hosted smoke reports must be redacted.

## Tests And Validation

- Add unit or integration coverage for queue idempotency, retry behavior, parse failure handling, and review output persistence when touched.
- Use local Supabase and GROBID for live worker validation when available.
- Run targeted worker tests plus `pnpm typecheck` for changes here.

## File Hygiene

- Keep queue handlers small. Move parsing, persistence, and rule-building logic into focused modules.
- Keep generated artifacts in private storage buckets or local ignored runtime folders, never in git.
