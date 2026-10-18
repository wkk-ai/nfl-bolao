-- Remove per-player PIN hashes. Saves go through RPCs with kickoff lock only.
-- The house PIN is a client gate, not a database check.

drop function if exists public.save_picks(text, text, jsonb, boolean);
drop function if exists public.submit_week(text, text, integer);
drop function if exists public.visible_picks(text, text);
drop function if exists public.has_pin(text);
drop function if exists public._pin_verify(text, text);
drop function if exists public._pin_set_or_verify(text, text);

alter table public.players drop column if exists pin_hash;

delete from public.picks;

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
      p.submitted_at is not null
      and g.kickoff <= now()
    );
end;
$$;

create or replace function public.save_picks(
  p_player text,
  p_picks jsonb,
  p_submit boolean default false
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
      case when p_submit then now_ts else null end
    )
    on conflict (player_id, game_id) do update set
      winner_abbr = excluded.winner_abbr,
      margin_bucket = excluded.margin_bucket,
      submitted_at = case
        when p_submit then coalesce(pk.submitted_at, now_ts)
        else pk.submitted_at
      end
    where exists (
      select 1 from public.games gx
      where gx.id = pk.game_id
        and gx.kickoff > now_ts
        and gx.status in ('scheduled', 'upcoming')
    );
    written := written + 1;
  end loop;

  if p_submit then
    update public.picks pk
      set submitted_at = now_ts
    where pk.player_id = p_player
      and pk.submitted_at is null
      and exists (
        select 1 from public.games gx
        where gx.id = pk.game_id
          and gx.kickoff > now_ts
          and gx.status in ('scheduled', 'upcoming')
          and (
            jsonb_array_length(p_picks) = 0
            or gx.week_id = coalesce((p_picks->0->>'week_id')::int, gx.week_id)
          )
      );
  end if;

  return jsonb_build_object('ok', true, 'written', written);
end;
$$;

create or replace function public.submit_week(p_player text, p_week integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  now_ts timestamptz := now();
  n int;
begin
  if p_player not in ('will', 'sara') then
    raise exception 'bad_player';
  end if;
  update public.picks pk
    set submitted_at = now_ts
  where pk.player_id = p_player
    and pk.week_id = p_week
    and pk.submitted_at is null
    and exists (
      select 1 from public.games gx
      where gx.id = pk.game_id
        and gx.kickoff > now_ts
        and gx.status in ('scheduled', 'upcoming')
    );
  get diagnostics n = row_count;
  return jsonb_build_object('ok', true, 'submitted', n);
end;
$$;

create or replace function public.picks_kickoff_guard()
returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1 from public.games g
    where g.id = new.game_id
      and (g.kickoff <= now() or g.status not in ('scheduled', 'upcoming'))
  ) then
    raise exception 'kickoff_lock';
  end if;
  return new;
end;
$$;

drop trigger if exists picks_kickoff_guard on public.picks;
create trigger picks_kickoff_guard
  before insert or update on public.picks
  for each row execute procedure public.picks_kickoff_guard();

revoke all on function public.visible_picks(text) from public;
revoke all on function public.save_picks(text, jsonb, boolean) from public;
revoke all on function public.submit_week(text, integer) from public;
grant execute on function public.visible_picks(text) to anon, authenticated;
grant execute on function public.save_picks(text, jsonb, boolean) to anon, authenticated;
grant execute on function public.submit_week(text, integer) to anon, authenticated;

notify pgrst, 'reload schema';
