begin;

select plan(6);

select ok(
  exists(
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'papers'
  ),
  'public.papers exists'
);

select ok(
  exists(
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'papers'
      and c.relrowsecurity
  ),
  'public.papers has RLS enabled'
);

select ok(
  exists(
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'papers'
      and policyname = 'papers_owner_access'
  ),
  'papers owner policy exists'
);

select ok(
  exists(
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'reviews'
      and c.relrowsecurity
  ),
  'public.reviews has RLS enabled'
);

select ok(
  exists(
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'review_suggestions'
      and policyname = 'review_suggestions_owner_access'
  ),
  'review suggestions owner policy exists'
);

select ok(
  exists(select 1 from pg_extension where extname = 'pgmq'),
  'pgmq extension exists'
);

select * from finish();

rollback;
