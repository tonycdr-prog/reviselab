create table if not exists public.review_events (
  id text primary key,
  review_id text not null references public.reviews(id) on delete cascade,
  event_kind text not null,
  label text not null,
  detail text,
  file_path text,
  suggestion_id text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists review_events_review_id_idx
on public.review_events(review_id);

create index if not exists review_events_suggestion_id_idx
on public.review_events(suggestion_id);

create index if not exists review_events_file_path_idx
on public.review_events(file_path);

alter table public.review_events enable row level security;

drop policy if exists "review_events_owner_access" on public.review_events;
create policy "review_events_owner_access"
on public.review_events
for select
using (
  exists (
    select 1
    from public.reviews
    join public.papers on papers.id = reviews.paper_id
    where reviews.id = review_events.review_id
      and papers.owner_user_id = auth.uid()
  )
);

drop policy if exists "review_events_owner_insert" on public.review_events;
create policy "review_events_owner_insert"
on public.review_events
for insert
with check (
  exists (
    select 1
    from public.reviews
    join public.papers on papers.id = reviews.paper_id
    where reviews.id = review_events.review_id
      and papers.owner_user_id = auth.uid()
  )
);
