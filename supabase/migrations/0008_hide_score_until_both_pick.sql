-- Scores for games that are not already public stay hidden until both chairs have a pick.
-- A first pick is still allowed after kickoff. A saved pick cannot be changed after kickoff.
-- Games that are already final stay public, so missed weeks do not reopen.

alter table public.games
  add column if not exists scores_public boolean not null default false;

do $$
begin
  if not exists (select 1 from public.games where scores_public) then
    update public.games set scores_public = true where status = 'final';
  end if;
end $$;

create or replace function public.visible_games()
returns table (
  id text,
  week_id integer,
  kickoff timestamptz,
  home_abbr text,
  away_abbr text,
  home_name text,
  away_name text,
  home_score integer,
  away_score integer,
  status text,
  winner_abbr text,
  margin integer,
  margin_bucket integer,
  venue text,
  scores_public boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    g.id,
    g.week_id,
    g.kickoff,
    g.home_abbr,
    g.away_abbr,
    g.home_name,
    g.away_name,
    case when g.scores_public or ready.ok then g.home_score else null end,
    case when g.scores_public or ready.ok then g.away_score else null end,
    case
      when g.scores_public or ready.ok then g.status
      when g.status = 'final' then 'in_progress'
      else g.status
    end,
    case when g.scores_public or ready.ok then g.winner_abbr else null end,
    case when g.scores_public or ready.ok then g.margin else null end,
    case when g.scores_public or ready.ok then g.margin_bucket else null end,
    g.venue,
    g.scores_public
  from public.games g
  left join lateral (
    select (
      exists (select 1 from public.picks p where p.game_id = g.id and p.player_id = 'will')
      and exists (select 1 from public.picks p where p.game_id = g.id and p.player_id = 'sara')
    ) as ok
  ) ready on true;
$$;

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
    or (
      g.kickoff <= now()
      and (
        g.scores_public
        or exists (
          select 1 from public.picks mine
          where mine.game_id = p.game_id
            and mine.player_id = p_player
        )
      )
    );
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
  already boolean;
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
    select exists (
      select 1 from public.picks existing
      where existing.player_id = p_player and existing.game_id = g.id
    ) into already;
    if already and (
      g.kickoff <= now_ts or g.status not in ('scheduled', 'upcoming')
    ) then
      raise exception 'kickoff_lock';
    end if;
    if not already and g.scores_public and (
      g.kickoff <= now_ts or g.status not in ('scheduled', 'upcoming')
    ) then
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

create or replace function public.picks_kickoff_guard()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  g public.games%rowtype;
begin
  select * into g from public.games where id = new.game_id;
  if not found then
    raise exception 'bad_game';
  end if;

  if tg_op = 'UPDATE' then
    if g.kickoff <= now() or g.status not in ('scheduled', 'upcoming') then
      raise exception 'kickoff_lock';
    end if;
    return new;
  end if;

  if g.scores_public and (
    g.kickoff <= now() or g.status not in ('scheduled', 'upcoming')
  ) then
    raise exception 'kickoff_lock';
  end if;
  return new;
end;
$$;

revoke all on function public.visible_games() from public;
grant execute on function public.visible_games() to anon, authenticated;
grant execute on function public.visible_picks(text) to anon, authenticated;
grant execute on function public.save_picks(text, jsonb, boolean) to anon, authenticated;

revoke select on table public.results from anon, authenticated;

notify pgrst, 'reload schema';
