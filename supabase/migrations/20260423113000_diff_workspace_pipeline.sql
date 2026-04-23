alter table public.paper_versions
  add column if not exists source_file_name text,
  add column if not exists parse_error text,
  add column if not exists parser_engine text,
  add column if not exists parse_artifact_path text;

alter table public.reviews
  add column if not exists engine_version text,
  add column if not exists failed_reason text;

create table if not exists public.review_files (
  id text primary key,
  review_id text not null references public.reviews(id) on delete cascade,
  path text not null,
  title text not null,
  severity text not null,
  status text not null default 'unchanged',
  change_count integer not null default 0,
  diff_stats_json jsonb not null default '{}'::jsonb,
  base_text text not null default '',
  current_text text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (review_id, path)
);

create table if not exists public.review_comments (
  id text primary key,
  review_id text not null references public.reviews(id) on delete cascade,
  review_file_id text not null references public.review_files(id) on delete cascade,
  anchor_id text not null,
  rule_id text not null,
  rule_version text not null,
  target text not null,
  severity text not null,
  body text not null,
  source_url text,
  linked_suggestion_ids_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.extension_pairings (
  id text primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  workspace_id text not null references public.workspaces(id) on delete cascade,
  code text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.review_checks
  add column if not exists rule_id text not null default 'legacy',
  add column if not exists rule_version text not null default 'legacy',
  add column if not exists review_file_id text references public.review_files(id) on delete set null,
  add column if not exists anchor_id text,
  add column if not exists linked_suggestion_ids_json jsonb not null default '[]'::jsonb;

alter table public.review_suggestions
  add column if not exists review_file_id text references public.review_files(id) on delete cascade,
  add column if not exists status text not null default 'suggested',
  add column if not exists anchor_json jsonb,
  add column if not exists diff_stats_json jsonb not null default '{}'::jsonb,
  add column if not exists edited_text text,
  add column if not exists linked_check_ids_json jsonb not null default '[]'::jsonb,
  add column if not exists linked_comment_ids_json jsonb not null default '[]'::jsonb,
  add column if not exists applied_at timestamptz,
  add column if not exists resolved_at timestamptz,
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

drop trigger if exists set_review_files_updated_at on public.review_files;
create trigger set_review_files_updated_at
before update on public.review_files
for each row
execute function public.set_updated_at();

drop trigger if exists set_review_comments_updated_at on public.review_comments;
create trigger set_review_comments_updated_at
before update on public.review_comments
for each row
execute function public.set_updated_at();

drop trigger if exists set_extension_pairings_updated_at on public.extension_pairings;
create trigger set_extension_pairings_updated_at
before update on public.extension_pairings
for each row
execute function public.set_updated_at();

drop trigger if exists set_review_suggestions_updated_at on public.review_suggestions;
create trigger set_review_suggestions_updated_at
before update on public.review_suggestions
for each row
execute function public.set_updated_at();

create index if not exists review_files_review_id_idx on public.review_files(review_id);
create index if not exists review_comments_review_id_idx on public.review_comments(review_id);
create index if not exists review_comments_review_file_id_idx on public.review_comments(review_file_id);
create index if not exists review_checks_review_file_id_idx on public.review_checks(review_file_id);
create index if not exists review_suggestions_review_file_id_idx on public.review_suggestions(review_file_id);
create index if not exists extension_pairings_profile_id_idx on public.extension_pairings(profile_id);
create index if not exists extension_pairings_workspace_id_idx on public.extension_pairings(workspace_id);
create index if not exists extension_pairings_code_idx on public.extension_pairings(code);

alter table public.review_files enable row level security;
alter table public.review_comments enable row level security;
alter table public.extension_pairings enable row level security;

drop policy if exists "workspaces_owner_write" on public.workspaces;
create policy "workspaces_owner_write"
on public.workspaces
for all
using (auth.uid() = owner_user_id)
with check (auth.uid() = owner_user_id);

drop policy if exists "workspace_members_self_insert" on public.workspace_members;
create policy "workspace_members_self_insert"
on public.workspace_members
for insert
with check (auth.uid() = user_id);

drop policy if exists "workspace_members_self_update" on public.workspace_members;
create policy "workspace_members_self_update"
on public.workspace_members
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "paper_versions_owner_insert" on public.paper_versions;
create policy "paper_versions_owner_insert"
on public.paper_versions
for insert
with check (
  exists (
    select 1
    from public.papers
    where papers.id = paper_versions.paper_id
      and papers.owner_user_id = auth.uid()
  )
);

drop policy if exists "paper_versions_owner_update" on public.paper_versions;
create policy "paper_versions_owner_update"
on public.paper_versions
for update
using (
  exists (
    select 1
    from public.papers
    where papers.id = paper_versions.paper_id
      and papers.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.papers
    where papers.id = paper_versions.paper_id
      and papers.owner_user_id = auth.uid()
  )
);

drop policy if exists "reviews_owner_insert" on public.reviews;
create policy "reviews_owner_insert"
on public.reviews
for insert
with check (
  exists (
    select 1
    from public.papers
    where papers.id = reviews.paper_id
      and papers.owner_user_id = auth.uid()
  )
);

drop policy if exists "reviews_owner_update" on public.reviews;
create policy "reviews_owner_update"
on public.reviews
for update
using (
  exists (
    select 1
    from public.papers
    where papers.id = reviews.paper_id
      and papers.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.papers
    where papers.id = reviews.paper_id
      and papers.owner_user_id = auth.uid()
  )
);

drop policy if exists "review_files_owner_access" on public.review_files;
create policy "review_files_owner_access"
on public.review_files
for select
using (
  exists (
    select 1
    from public.reviews
    join public.papers on papers.id = reviews.paper_id
    where reviews.id = review_files.review_id
      and papers.owner_user_id = auth.uid()
  )
);

drop policy if exists "review_files_owner_update" on public.review_files;
create policy "review_files_owner_update"
on public.review_files
for update
using (
  exists (
    select 1
    from public.reviews
    join public.papers on papers.id = reviews.paper_id
    where reviews.id = review_files.review_id
      and papers.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.reviews
    join public.papers on papers.id = reviews.paper_id
    where reviews.id = review_files.review_id
      and papers.owner_user_id = auth.uid()
  )
);

drop policy if exists "review_checks_owner_update" on public.review_checks;
create policy "review_checks_owner_update"
on public.review_checks
for update
using (
  exists (
    select 1
    from public.reviews
    join public.papers on papers.id = reviews.paper_id
    where reviews.id = review_checks.review_id
      and papers.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.reviews
    join public.papers on papers.id = reviews.paper_id
    where reviews.id = review_checks.review_id
      and papers.owner_user_id = auth.uid()
  )
);

drop policy if exists "review_suggestions_owner_update" on public.review_suggestions;
create policy "review_suggestions_owner_update"
on public.review_suggestions
for update
using (
  exists (
    select 1
    from public.reviews
    join public.papers on papers.id = reviews.paper_id
    where reviews.id = review_suggestions.review_id
      and papers.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.reviews
    join public.papers on papers.id = reviews.paper_id
    where reviews.id = review_suggestions.review_id
      and papers.owner_user_id = auth.uid()
  )
);

drop policy if exists "review_comments_owner_access" on public.review_comments;
create policy "review_comments_owner_access"
on public.review_comments
for select
using (
  exists (
    select 1
    from public.reviews
    join public.papers on papers.id = reviews.paper_id
    where reviews.id = review_comments.review_id
      and papers.owner_user_id = auth.uid()
  )
);

drop policy if exists "extension_pairings_self_access" on public.extension_pairings;
create policy "extension_pairings_self_access"
on public.extension_pairings
for all
using (auth.uid() = profile_id)
with check (auth.uid() = profile_id);
