# Rule precision QA

ReviseLab's deterministic rules remain the production authority. Precision QA
checks whether those rules fired correctly against a small labeled CS/AI smoke
set.

## Local workflow

```sh
pnpm qa:real-manuscripts
pnpm rules:precision
```

`pnpm qa:real-manuscripts` writes `.local-runtime/real-manuscript-report.json`.
`pnpm rules:precision` compares that report with
`docs/rule-precision-gold.json` and writes
`.local-runtime/rule-precision-report.json`.

## Optional LLM adjudication

Use an LLM only as an offline second reviewer, never as production authority:

```sh
OPENAI_API_KEY=... pnpm rules:precision:llm
```

The script sends only redacted rule-result metadata from the local precision
report and writes `.local-runtime/rule-precision-llm-report.json`.

## Current pass bar

- No healthy rule should fire on every labeled manuscript.
- Fired checks must include source URL, checked date, evidence, target file, and
  anchor.
- Precision for fired checks must be at least `0.8` on the labeled smoke set.
- Blocker false positives are not acceptable.
