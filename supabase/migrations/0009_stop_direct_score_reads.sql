-- The site reads scores through visible_games. Direct reads of the result columns are closed
-- so an old copy of the page cannot pull the score before both chairs have picked.

revoke select on table public.games from anon, authenticated;
grant select (
  id,
  week_id,
  kickoff,
  home_abbr,
  away_abbr,
  home_name,
  away_name,
  venue,
  scores_public
) on table public.games to anon, authenticated;

do $$
begin
  if exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'games'
  ) then
    alter publication supabase_realtime drop table public.games;
  end if;
end $$;
