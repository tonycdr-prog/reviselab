@../../RTK.md

# Web App Agent Contract

## Scope

- This file governs `apps/web`, including Next.js App Router routes, route handlers, web-only server code, web components, tests, and browser smoke flows.
- The web app is the system of record for ReviseLab. The extension is a companion, not an editor replacement.
- Authenticated app paths must use real state and real errors. Preview/sample state is allowed only under `/preview`, marketing/demo surfaces, and tests.

## Architecture Rules

- Use Next.js App Router patterns. Keep route-level data loading in server components or route handlers where possible.
- Keep browser-only behavior in explicit client components with `"use client"`.
- Do not import `@carbon/react`, `@carbon/icons-react`, or external UI kits directly. Import UI only from `@reviselab/ui`, `@reviselab/ui/carbon`, or `@reviselab/ui/icons`.
- Do not rebuild the review workspace layout in app code. Extend the shared recipe from `@reviselab/ui`.
- Keep URL-backed review workspace state canonical: `tab`, `file`, `anchor`, and `context`.
- `file=` selects a file only. `anchor=` is the only reason to deep-scroll/focus a diff block.
- Keep public API route names stable unless there is an explicit migration plan.

## Auth And Ownership

- Use `@supabase/ssr` for web authenticated flows.
- Do not trust `user_metadata` for authorization. Authorization must be database/RLS-driven.
- Authenticated app-created papers, paper versions, reviews, extension installations, and events must be owned by a user/workspace.
- Do not create user-scoped app rows with `owner_user_id: null` or `workspace_id: null`.
- Do not use the service-role client for routine user-scoped app flows. Reserve it for privileged server operations that cannot run under RLS.
- Expired magic links and auth callback failures must show recoverable, user-safe messaging.

## Upload And Review Lifecycle

- Upload flows must show explicit async state: idle, uploading, creating review, redirecting, parse queued, parsing, review queued, reviewing, failed parse, failed review, retrying, and ready.
- PDF and LaTeX ZIP uploads must produce real source-backed paper versions in authenticated flows.
- Live parser failures must be explicit and retryable. Do not silently synthesize live-looking review data.
- `ReviewProgress` is the UI source of truth for non-ready review states.
- Suggestion actions must persist through the existing API and append durable review history/events.

## UI And Content

- Carbon is the implementation standard. Use Carbon grid, spacing tokens, components, type scale, focus states, loading states, empty states, notifications, DataTable, FileUploader, Tabs, Tags, and AI Label patterns.
- IBM Plex is the only product type family.
- Keep copy sentence case, direct, and submission-readiness focused.
- Do not use breadcrumbs in the review workspace.
- Do not show diagnostics to normal users. Platform/admin diagnostics must be gated.
- Do not show user-facing `Paperlint`.

## Tests And Validation

- Add or update Playwright coverage when changing visible app surfaces.
- Add interaction tests for tabs, upload state, dashboard controls, file rail selection, check/comment jump links, and suggestion actions.
- Add unit tests for routing helpers, upload state helpers, auth guards, and lifecycle mapping when touched.
- Run at least the affected targeted tests before handing off. For broad changes run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and relevant visual tests.

## File Hygiene

- Keep route components thin. Move complex client state to components or helpers.
- Split oversized components by responsibility before adding more state.
- Do not commit `.next`, `test-results`, `playwright-report`, route type artifacts, screenshots, or local runtime files.
- If `apps/web/next-env.d.ts` is regenerated with a dev-only `.next/dev` import, restore the committed stable route type import before committing.
