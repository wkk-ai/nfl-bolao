-- Publishable-key writes for the shared Will vs Sara board.
-- Tables stay the 0001 schema; this only adds grants, write policies, and live updates.

grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on table
  public.players,
  public.weeks,
  public.games,
  public.picks,
  public.reactions
  to anon, authenticated, service_role;

grant select, insert, update, delete on table public.results
  to anon, authenticated, service_role;

grant usage, select on all sequences in schema public to anon, authenticated, service_role;

drop policy if exists "public write players" on public.players;
create policy "public write players" on public.players for insert with check (true);
drop policy if exists "public update players" on public.players;
create policy "public update players" on public.players for update using (true) with check (true);

drop policy if exists "public write weeks" on public.weeks;
create policy "public write weeks" on public.weeks for insert with check (true);
drop policy if exists "public update weeks" on public.weeks;
create policy "public update weeks" on public.weeks for update using (true) with check (true);

drop policy if exists "public write games" on public.games;
create policy "public write games" on public.games for insert with check (true);
drop policy if exists "public update games" on public.games;
create policy "public update games" on public.games for update using (true) with check (true);

drop policy if exists "public update reactions" on public.reactions;
create policy "public update reactions" on public.reactions for update using (true) with check (true);

alter table public.picks replica identity full;
alter table public.reactions replica identity full;
alter table public.games replica identity full;

do $$
begin
  begin
    alter publication supabase_realtime add table public.picks;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.reactions;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.games;
  exception when duplicate_object then null;
  end;
end $$;
