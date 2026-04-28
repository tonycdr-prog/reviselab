@../../RTK.md

# UI Package Agent Contract

## Scope

- This file governs `packages/ui`, the only package allowed to wrap Carbon components and expose ReviseLab UI primitives, recipes, icons, and styles.
- App teams must consume UI from this package, not directly from Carbon.

## Carbon Ownership

- `packages/ui` is the only place where `@carbon/react` and `@carbon/icons-react` imports are allowed.
- Re-export approved Carbon primitives through `@reviselab/ui/carbon` and icons through `@reviselab/ui/icons`.
- Carbon `llms.txt` is the implementation source of truth. IBM Design Language informs craft and voice, but Carbon wins when there is overlap.
- Use Carbon grid, 2x spacing, tokens, type scale, buttons, tabs, tags, notifications, forms, data tables, skeletons, inline loading, and AI label patterns.
- IBM Plex is the only product typeface family.
- Do not introduce another UI kit, custom icon set, arbitrary color palette, or non-token spacing system.

## Review Workspace Recipe

- The canonical workspace remains Overview, Checks, Files changed, Comments, and History.
- Do not add breadcrumbs to the review workspace.
- The Files changed workbench owns the pull-request interaction: file rail, diff center, inspector, anchors, actions, and history.
- Keep the inspector as the canonical suggestion action area.
- Avoid duplicate action bars and duplicate interactive AI labels.
- Checks and comments must jump to `tab=files`, selected file, anchor, and context.
- Desktop uses a compact file rail, wide scroll-contained diff center, and stable inspector. Narrow view uses unified/stacked behavior.
- Long code/diff lines must scroll inside the diff renderer, not create page-level horizontal scroll.

## AI And Explainability

- Every AI-generated suggestion must use Carbon AI label and explainability affordances.
- Manual edits remove AI visual state until restored.
- Restore labels must distinguish AI suggestions when origin is AI.
- Explainability copy must remain visible in the inspector and must not be hidden behind unstable overlays.

## Styling Rules

- Use CSS variables and Carbon tokens. No inline colors, arbitrary spacing values, or custom one-off primitives unless unavoidable and documented.
- Keep style files organized by surface. Split CSS before selectors become hard to trace.
- Avoid page-level `overflow-x`; use local scroll containers for tables, diffs, and code.
- Tags/chips must wrap or truncate predictably. They must not collide with buttons or code.

## Tests And Validation

- UI behavior must be covered with unit tests in the consuming app or package tests where available.
- Visual changes to landing, dashboard, upload form, sign-in, review workspace, or extension panel require Playwright screenshot updates.
- Add interaction tests for tabs, file rail, diff actions, AI label visibility, and responsive layout when touched.

## File Hygiene

- Keep recipes, leaf components, shared types, and CSS separated.
- Do not let a single component own routing, persistence, visual layout, and mutation behavior.
- Do not commit generated CSS artifacts or screenshots outside approved test snapshots.
