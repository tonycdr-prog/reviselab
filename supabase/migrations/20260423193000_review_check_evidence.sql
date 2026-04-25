alter table public.review_checks
  add column if not exists evidence_json jsonb not null default '[]'::jsonb,
  add column if not exists source_checked_at timestamptz not null default now();

create index if not exists review_checks_evidence_json_idx
on public.review_checks using gin (evidence_json);
