@../../RTK.md

# Core Package Agent Contract

## Scope

- This file governs `packages/core`, shared product types, brand config, deterministic rules, review snapshots, diff state, fixtures, and domain logic.
- Core must stay framework-independent. Do not import React, Next.js, Carbon, Supabase clients, Node-only runtime APIs, or browser APIs unless explicitly isolated.

## Brand And Product Model

- `src/brand.ts` is the single shared brand source.
- User-facing product name is `ReviseLab`.
- Product category is `preprint review workspace`.
- Primary tagline is `Review your paper like a pull request.`
- `Paperlint` is internal-only and must not appear in user-facing core strings.

## Review Model

- Keep review state typed and durable: readiness, review status, review progress, files, checks, comments, suggestions, events, anchors, and diff stats.
- Use one diff status enum everywhere: unchanged, suggested, edited, accepted, rejected, and resolved.
- Review file paths for v1 are `title.md`, `abstract.md`, `metadata.yml`, and `submission_notes.md`.
- Suggestions must carry origin, status, anchor, original text, suggested text, rationale, diff stats, linked checks/comments, and explainability when AI-generated.
- Checks/comments must carry exact file and anchor targets whenever possible.

## Deterministic Rule Contract

- Rules must be deterministic, source-backed, versioned, and fixture-tested.
- Each rule hit must include rule id, version, source URL, source checked date, evidence, severity, readiness impact, and target mapping.
- Do not judge scientific correctness or novelty. Rules assess submission readiness risk.
- Core v1 rules include category fit, paper type risk, CS review/survey/position policy risk, endorsement guidance, missing metadata, overclaiming, AI-disclosure risk, and source/PDF parse failures.
- Category-fit changes require meaningful score margin before suggesting a different category.
- Overclaiming must warn only on anchored high-risk claims in title/abstract or explicitly supported source fields.
- Missing metadata must not warn solely because PDF author extraction is incomplete.

## Precision And Fixtures

- Rule changes must include true-positive and false-positive fixture coverage where feasible.
- Precision labels live in docs and reports; do not commit local manuscript contents.
- Optional LLM adjudication is offline evaluation only. It must never become production authority.

## Tests And Validation

- Add unit tests for every rule behavior change.
- Add snapshot/fixture tests when changing generated review shape.
- Run core tests and `pnpm typecheck` after domain model changes.

## File Hygiene

- Keep domain types, rule modules, fixture builders, and sample data separate.
- Avoid large catch-all files. Split by rule or domain responsibility.
- Core should not know about UI layout, storage buckets, routes, or queue implementation.
