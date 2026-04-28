@../../RTK.md

# Extension Agent Contract

## Scope

- This file governs `apps/extension`, the Chrome-first Overleaf companion extension built with WXT.
- The extension is a companion panel. It must not become a full editor replacement or project-sync product in v1.

## Product Rules

- User-facing extension copy must say `ReviseLab`.
- The extension display name and onboarding text must come from the shared brand config contract.
- Core extension actions are pairing, open latest review, selection handoff, and stable empty/loading/error states.
- Do not introduce full Overleaf project sync without a separate product decision.

## UI Rules

- Extension UI must use shared `@reviselab/ui` surfaces where feasible and follow Carbon/IBM Plex rules.
- Do not import `@carbon/react` or `@carbon/icons-react` directly.
- Keep extension controls compact, clear, and companion-scoped.
- Every AI-generated surface must preserve Carbon AI label/explainability behavior if AI content is shown.

## Auth And Data

- Pairing must use short-lived codes exchanged for scoped installation tokens.
- Installation tokens must be treated as secrets and stored only through browser extension storage mechanisms appropriate for credentials.
- Do not expose service-role credentials or database URLs to extension code.
- Extension-created reviews must become real workspace objects, not transient snapshots, once live auth is available.

## Tests And Validation

- Add extension tests for pairing, latest-review fetch, selection handoff, and empty/loading/error states.
- When UI changes, update extension panel visual coverage.
- Validate Chrome-first behavior before considering any other browser.

## File Hygiene

- Do not commit WXT build output, extension zips, generated manifests, or local browser profiles.
- Keep content-script logic separate from panel UI logic.
