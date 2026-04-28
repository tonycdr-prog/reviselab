@../RTK.md

# Scripts Agent Contract

## Scope

- This file governs `scripts`, repo automation, smoke tests, environment checks, fixture validation, deployment helpers, and guardrails.

## Safety Rules

- Scripts must not print secrets, tokens, database passwords, service-role keys, full Railway/Supabase env values, or manuscript contents.
- Redact hosted smoke reports and logs before writing them to tracked or artifact paths.
- Scripts that write env files must back up remote-looking env files before replacing them with local values.
- Destructive operations must be explicit and scoped. Do not delete user data or local files outside documented generated/runtime paths.

## Runtime Rules

- Use Node scripts for cross-platform repo automation.
- Keep scripts idempotent where possible.
- Fail with actionable messages for missing Docker, Colima, Supabase CLI, GROBID, Railway variables, or required env.
- Avoid hidden network calls in generic lint/check scripts. Network-dependent checks should be named as hosted/live/smoke checks.

## Guardrails

- `check-guardrails.mjs` enforces repo hygiene, UI import boundaries, brand restrictions, file budgets, and generated file exclusions.
- New guardrails should be deterministic and low-noise.
- If a legitimate file exceeds a file budget, prefer splitting it. Update `docs/file-budget-allowlist.json` only with a specific reason.

## Smoke And Fixture Scripts

- `.local-manuscripts` contents are local-only and gitignored.
- Fixture scripts may verify file presence and shape but must not commit or print manuscript contents.
- Hosted/live smoke scripts should write redacted summaries under `.local-runtime`.
- PDF smoke requires GROBID. LaTeX ZIP smoke should remain the fastest live path.

## Tests And Validation

- Add tests or dry-run modes for complex scripts where feasible.
- Run affected scripts locally after editing them.
- Keep shell-specific behavior minimal because scripts are run from pnpm on macOS and CI.

## File Hygiene

- Split large scripts by concern instead of adding more flags to a single catch-all script.
- Keep helper functions near the script unless reused by multiple scripts.
