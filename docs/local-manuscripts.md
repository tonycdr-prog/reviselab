# Local Manuscript Fixtures

ReviseLab uses `.local-manuscripts` for manual and live-flow manuscript testing.
The directory is intentionally ignored because PDFs and ZIPs can be large or
third-party licensed.

Run `pnpm fixtures:prepare` to generate the required synthetic fixtures. Run
`pnpm fixtures:check` before live QA to confirm the required files are present.

The fixture contract lives in `docs/local-manuscript-fixtures.json`. Keep
third-party arXiv downloads optional; automated tests should use generated
synthetic fixtures unless a test specifically requires a real paper.
