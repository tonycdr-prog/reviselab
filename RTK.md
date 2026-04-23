# ReviseLab Repo Toolkit

## Source of truth

- Start with Carbon [`llms.txt`](https://carbondesignsystem.com/llms.txt).
- Follow the Carbon pages linked from `llms.txt` for implementation details.
- Use IBM Design Language for philosophy, tone, and craft, but do not override Carbon implementation guidance where Carbon coverage exists.

## UI rules

- Import UI only from `@reviselab/ui`, `@reviselab/ui/carbon`, or `@reviselab/ui/icons`.
- Do not import `@carbon/react` or `@carbon/icons-react` outside `packages/ui`.
- Use IBM Plex only.
- Use Carbon AI label and explainability patterns for every AI-generated suggestion.
- Extend the canonical review workspace recipe instead of rebuilding the layout in app code.

## Brand and content

- `packages/core/src/brand.ts` is the only shared brand source.
- `Paperlint` is internal-only and may appear only as the repo codename.
- Keep UI copy in sentence case and use direct, plain language.

## File hygiene

- Do not commit generated outputs such as `.next`, `.wxt`, `dist`, `coverage`, `playwright-report`, `test-results`, caches, or `*.tsbuildinfo`.
- Keep files small enough to debug comfortably. Hard caps are enforced in `scripts/check-guardrails.mjs`, with allowlisted exceptions recorded in `docs/file-budget-allowlist.json`.
- Split files by responsibility before they become hard to trace.

## Environment and data

- Access environment variables only through dedicated env modules.
- Treat Supabase migrations as the schema source of truth.
- Keep service-role usage limited to privileged server or worker paths.

## Commands

- `pnpm audit:repo`: full repo audit including cleanup, guardrails, build, DB checks, and visual baselines.
- `pnpm lint`: workspace lint plus repo guardrails.
- `pnpm clean`: remove generated local build, debug, and Finder artifacts.
- `pnpm typecheck`: workspace type checks.
- `pnpm test`: unit and app tests.
- `pnpm test:visual`: Playwright screenshot tests.
- `pnpm db:reset`: reset the local Supabase stack when the CLI is available.
- `pnpm db:test`: run database tests when the CLI is available.
- `pnpm db:types:verify`: verify generated DB types are present.
