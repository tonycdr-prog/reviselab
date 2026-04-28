@../RTK.md

# Docs Agent Contract

## Scope

- This file governs `docs`, repo-tracked plans, manifests, operational notes, rule precision labels, production readiness docs, and fixture documentation.

## Documentation Rules

- Docs should describe stable decisions, operating procedures, contracts, or reproducible workflows.
- Do not use docs as a dumping ground for temporary task notes.
- Keep product docs aligned with the code contracts in `AGENTS.md`, `RTK.md`, and package types.
- When docs conflict with code-enforced guardrails, update both or explain the transition.

## Sensitive Data

- Do not commit secrets, production credentials, tokens, user emails beyond approved examples, database URLs with passwords, private manuscript contents, or proprietary paper text.
- `.local-manuscripts` stays gitignored. Docs may describe expected local fixture names and behavior only.
- Rule precision reports committed to docs must be labels/manifests only, not manuscript content.

## Product And UI Guidance

- Carbon remains the UI implementation source of truth.
- HIG or other external design references may be used only as quality lenses, not as component/style sources.
- Docs should reinforce that ReviseLab is a submission readiness control plane, not a grammar/editor competitor.

## Operational Docs

- Production deployment docs must distinguish web, worker, Supabase, GROBID, queues, storage, env vars, and monitoring.
- Local setup docs must distinguish local stack, hosted stack, preview-only flows, and live smoke flows.
- Failure semantics should be explicit: what fails, what retries, what users see, and what operators monitor.

## File Hygiene

- Keep long docs structured with clear sections and command blocks.
- Prefer links to source files, scripts, and migrations over copying implementation details.
- Update docs when a durable workflow changes. Do not update docs for every routine code edit.
