create schema if not exists extensions;
create schema if not exists pgmq;

create extension if not exists pgcrypto with schema extensions;
create extension if not exists vector with schema extensions;
create extension if not exists pgmq with schema pgmq;
create extension if not exists pg_cron with schema extensions;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key,
  display_name text,
  onboarding_state text not null default 'new',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.workspaces (
  id text primary key,
  name text not null,
  owner_user_id uuid,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.workspace_members (
  workspace_id text not null references public.workspaces(id) on delete cascade,
  user_id uuid not null,
  role text not null default 'owner',
  created_at timestamptz not null default timezone('utc', now()),
  primary key (workspace_id, user_id)
);

create table if not exists public.papers (
  id text primary key,
  workspace_id text references public.workspaces(id) on delete set null,
  owner_user_id uuid,
  title text not null,
  intended_category text,
  paper_type text not null,
  first_time_submitter boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.paper_versions (
  id text primary key,
  paper_id text not null references public.papers(id) on delete cascade,
  source_kind text not null,
  source_path text,
  parse_status text not null default 'uploaded',
  extracted_structure_json jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.reviews (
  id text primary key,
  paper_id text not null references public.papers(id) on delete cascade,
  paper_version_id text not null references public.paper_versions(id) on delete cascade,
  status text not null default 'queued',
  readiness text,
  context_json jsonb,
  summary_json jsonb,
  ai_presence_summary_json jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.review_checks (
  id text primary key,
  review_id text not null references public.reviews(id) on delete cascade,
  name text not null,
  state text not null,
  severity text not null,
  summary text not null,
  detail text not null,
  source_url text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.review_suggestions (
  id text primary key,
  review_id text not null references public.reviews(id) on delete cascade,
  file_path text not null,
  title text not null,
  severity text not null,
  rationale text not null,
  original_text text not null,
  suggested_text text not null,
  origin text not null,
  explainability_json jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.extension_installations (
  id text primary key,
  profile_id uuid,
  browser_name text not null default 'chrome',
  paired_token text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.usage_events (
  id text primary key,
  workspace_id text references public.workspaces(id) on delete cascade,
  event_name text not null,
  event_payload jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.arxiv_categories (
  id text primary key,
  code text not null unique,
  display_name text not null,
  description text not null,
  embedding extensions.vector(1536),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists papers_owner_user_id_idx on public.papers(owner_user_id);
create index if not exists paper_versions_paper_id_idx on public.paper_versions(paper_id);
create index if not exists reviews_paper_id_idx on public.reviews(paper_id);
create index if not exists review_checks_review_id_idx on public.review_checks(review_id);
create index if not exists review_suggestions_review_id_idx on public.review_suggestions(review_id);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists set_workspaces_updated_at on public.workspaces;
create trigger set_workspaces_updated_at
before update on public.workspaces
for each row
execute function public.set_updated_at();

drop trigger if exists set_papers_updated_at on public.papers;
create trigger set_papers_updated_at
before update on public.papers
for each row
execute function public.set_updated_at();

drop trigger if exists set_paper_versions_updated_at on public.paper_versions;
create trigger set_paper_versions_updated_at
before update on public.paper_versions
for each row
execute function public.set_updated_at();

drop trigger if exists set_reviews_updated_at on public.reviews;
create trigger set_reviews_updated_at
before update on public.reviews
for each row
execute function public.set_updated_at();

drop trigger if exists set_extension_installations_updated_at on public.extension_installations;
create trigger set_extension_installations_updated_at
before update on public.extension_installations
for each row
execute function public.set_updated_at();

drop trigger if exists set_arxiv_categories_updated_at on public.arxiv_categories;
create trigger set_arxiv_categories_updated_at
before update on public.arxiv_categories
for each row
execute function public.set_updated_at();

insert into storage.buckets (id, name, public)
values
  ('paper-sources', 'paper-sources', false),
  ('paper-artifacts', 'paper-artifacts', false)
on conflict (id) do nothing;

select pgmq.create('parse_paper');
select pgmq.create('run_review');
select pgmq.create('cleanup_artifacts');

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.papers enable row level security;
alter table public.paper_versions enable row level security;
alter table public.reviews enable row level security;
alter table public.review_checks enable row level security;
alter table public.review_suggestions enable row level security;
alter table public.extension_installations enable row level security;
alter table public.usage_events enable row level security;
alter table public.arxiv_categories enable row level security;

drop policy if exists "profiles_self_access" on public.profiles;
create policy "profiles_self_access"
on public.profiles
for all
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "workspace_members_self_access" on public.workspace_members;
create policy "workspace_members_self_access"
on public.workspace_members
for select
using (auth.uid() = user_id);

drop policy if exists "workspaces_member_access" on public.workspaces;
create policy "workspaces_member_access"
on public.workspaces
for select
using (
  exists (
    select 1
    from public.workspace_members members
    where members.workspace_id = workspaces.id
      and members.user_id = auth.uid()
  )
);

drop policy if exists "papers_owner_access" on public.papers;
create policy "papers_owner_access"
on public.papers
for all
using (auth.uid() = owner_user_id)
with check (auth.uid() = owner_user_id);

drop policy if exists "paper_versions_owner_access" on public.paper_versions;
create policy "paper_versions_owner_access"
on public.paper_versions
for select
using (
  exists (
    select 1
    from public.papers
    where papers.id = paper_versions.paper_id
      and papers.owner_user_id = auth.uid()
  )
);

drop policy if exists "reviews_owner_access" on public.reviews;
create policy "reviews_owner_access"
on public.reviews
for select
using (
  exists (
    select 1
    from public.papers
    where papers.id = reviews.paper_id
      and papers.owner_user_id = auth.uid()
  )
);

drop policy if exists "review_checks_owner_access" on public.review_checks;
create policy "review_checks_owner_access"
on public.review_checks
for select
using (
  exists (
    select 1
    from public.reviews
    join public.papers on papers.id = reviews.paper_id
    where reviews.id = review_checks.review_id
      and papers.owner_user_id = auth.uid()
  )
);

drop policy if exists "review_suggestions_owner_access" on public.review_suggestions;
create policy "review_suggestions_owner_access"
on public.review_suggestions
for select
using (
  exists (
    select 1
    from public.reviews
    join public.papers on papers.id = reviews.paper_id
    where reviews.id = review_suggestions.review_id
      and papers.owner_user_id = auth.uid()
  )
);

drop policy if exists "extension_installations_self_access" on public.extension_installations;
create policy "extension_installations_self_access"
on public.extension_installations
for all
using (auth.uid() = profile_id)
with check (auth.uid() = profile_id);

drop policy if exists "usage_events_workspace_access" on public.usage_events;
create policy "usage_events_workspace_access"
on public.usage_events
for select
using (
  exists (
    select 1
    from public.workspace_members
    where workspace_members.workspace_id = usage_events.workspace_id
      and workspace_members.user_id = auth.uid()
  )
);

drop policy if exists "arxiv_categories_read" on public.arxiv_categories;
create policy "arxiv_categories_read"
on public.arxiv_categories
for select
using (true);
