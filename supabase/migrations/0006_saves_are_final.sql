-- Every save is final. Old drafts saved before kickoff count.
-- Do not change winner or margin values.

update public.picks
set submitted_at = now()
where submitted_at is null;

create or replace function public.visible_picks(p_player text)
returns table (
  player_id text,
  game_id text,
  week_id integer,
  winner_abbr text,
  margin_bucket integer,
  submitted_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_player not in ('will', 'sara') then
    raise exception 'bad_player';
  end if;

  return query
  select
    p.player_id,
    p.game_id,
    p.week_id,
    p.winner_abbr,
    p.margin_bucket,
    p.submitted_at
  from public.picks p
  join public.games g on g.id = p.game_id
  where
    p.player_id = p_player
    or g.kickoff <= now();
end;
$$;

create or replace function public.save_picks(
  p_player text,
  p_picks jsonb,
  p_submit boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  rec jsonb;
  g public.games%rowtype;
  now_ts timestamptz := now();
  written int := 0;
  week_id int;
begin
  if p_player not in ('will', 'sara') then
    raise exception 'bad_player';
  end if;
  if p_picks is null or jsonb_typeof(p_picks) <> 'array' then
    raise exception 'bad_picks';
  end if;

  for rec in select value from jsonb_array_elements(p_picks)
  loop
    select * into g from public.games where id = rec->>'game_id';
    if not found then
      raise exception 'bad_game';
    end if;
    if g.kickoff <= now_ts or g.status not in ('scheduled', 'upcoming') then
      raise exception 'kickoff_lock';
    end if;
    week_id := coalesce((rec->>'week_id')::int, g.week_id);
    if week_id <> g.week_id then
      raise exception 'bad_week';
    end if;
    if (rec->>'margin_bucket')::int not in (5, 10, 15, 20) then
      raise exception 'bad_bucket';
    end if;
    if rec->>'winner_abbr' not in (g.home_abbr, g.away_abbr) then
      raise exception 'bad_winner';
    end if;

    insert into public.picks as pk (
      player_id, game_id, week_id, winner_abbr, margin_bucket, submitted_at
    ) values (
      p_player,
      g.id,
      g.week_id,
      rec->>'winner_abbr',
      (rec->>'margin_bucket')::int,
      now_ts
    )
    on conflict (player_id, game_id) do update set
      winner_abbr = excluded.winner_abbr,
      margin_bucket = excluded.margin_bucket,
      submitted_at = coalesce(pk.submitted_at, now_ts)
    where exists (
      select 1 from public.games gx
      where gx.id = pk.game_id
        and gx.kickoff > now_ts
        and gx.status in ('scheduled', 'upcoming')
    );
    written := written + 1;
  end loop;

  return jsonb_build_object('ok', true, 'written', written);
end;
$$;

grant execute on function public.visible_picks(text) to anon, authenticated;
grant execute on function public.save_picks(text, jsonb, boolean) to anon, authenticated;

notify pgrst, 'reload schema';
