-- One row: time of the last successful ESPN score write.
-- Public can read it. Only the score job (postgres) writes it.

create table if not exists public.score_sync (
  id integer primary key check (id = 1),
  updated_at timestamptz not null
);

alter table public.score_sync enable row level security;

drop policy if exists "public read score_sync" on public.score_sync;
create policy "public read score_sync" on public.score_sync for select using (true);

grant select on table public.score_sync to anon, authenticated, service_role;

notify pgrst, 'reload schema';
