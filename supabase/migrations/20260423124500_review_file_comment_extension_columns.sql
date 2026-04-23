alter table public.review_files
  add column if not exists suggestion_ids_json jsonb not null default '[]'::jsonb;

alter table public.review_comments
  add column if not exists file_path text;

update public.review_comments comments
set file_path = files.path
from public.review_files files
where files.id = comments.review_file_id
  and comments.file_path is null;

update public.review_comments
set file_path = 'abstract.md'
where file_path is null;

alter table public.review_comments
  alter column file_path set not null;

alter table public.extension_installations
  add column if not exists workspace_id text references public.workspaces(id) on delete cascade;

create index if not exists review_files_suggestion_ids_idx
on public.review_files using gin (suggestion_ids_json);

create index if not exists review_comments_file_path_idx
on public.review_comments(file_path);

create index if not exists extension_installations_workspace_id_idx
on public.extension_installations(workspace_id);
