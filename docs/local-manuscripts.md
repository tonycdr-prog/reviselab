# Local Manuscript Fixtures

ReviseLab uses `.local-manuscripts` for manual and live-flow manuscript testing.
The directory is intentionally ignored because PDFs and ZIPs can be large or
third-party licensed.

Run `pnpm fixtures:prepare` to generate the required synthetic fixtures. Run
`pnpm fixtures:check` before live QA to confirm the required files are present.

The fixture contract lives in `docs/local-manuscript-fixtures.json`. Keep
third-party arXiv downloads optional; automated tests should use generated
synthetic fixtures unless a test specifically requires a real paper.

## Real Manuscript Evaluation

Use the real-manuscript evaluator after `pnpm dev:live` is running. It downloads
ten public CS/AI arXiv PDFs into `.local-manuscripts/real/`, uploads each PDF
through the same storage, queue, parser, worker, and review path as the product,
and writes a local report to `.local-runtime/real-manuscript-report.json`.

```sh
pnpm qa:real-manuscripts
```

Useful options:

```sh
pnpm qa:real-manuscripts -- --download-only
pnpm qa:real-manuscripts -- --limit=3
pnpm qa:real-manuscripts -- --allow-failures
pnpm qa:real-manuscripts -- --keep
```

Use the report to track false positives, missing checks, bad diff suggestions,
parser failures, and confusing readiness states. Downloaded PDFs and reports are
local QA artifacts and stay out of git.
