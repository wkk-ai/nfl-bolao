-- pgcrypto lives in the extensions schema on Supabase. PIN functions that
-- set search_path = public cannot see crypt/gen_salt, so the first save
-- never stored a code and never wrote the draft.

create or replace function public._pin_verify(p_player text, p_pin text) returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  stored text;
begin
  if p_player not in ('will', 'sara') then
    return false;
  end if;
  if p_pin is null or p_pin !~ '^\d{4}$' then
    return false;
  end if;
  select pin_hash into stored from public.players where id = p_player;
  if stored is null then
    return false;
  end if;
  return stored = extensions.crypt(p_pin, stored);
end;
$$;

create or replace function public._pin_set_or_verify(p_player text, p_pin text) returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  stored text;
begin
  if p_player not in ('will', 'sara') then
    return false;
  end if;
  if p_pin is null or p_pin !~ '^\d{4}$' then
    return false;
  end if;
  select pin_hash into stored from public.players where id = p_player for update;
  if stored is null then
    update public.players
      set pin_hash = extensions.crypt(p_pin, extensions.gen_salt('bf'::text, 8))
      where id = p_player;
    return true;
  end if;
  return stored = extensions.crypt(p_pin, stored);
end;
$$;

alter function public.has_pin(text) set search_path = public, extensions;
alter function public.visible_picks(text, text) set search_path = public, extensions;
alter function public.save_picks(text, text, jsonb, boolean) set search_path = public, extensions;
alter function public.submit_week(text, text, integer) set search_path = public, extensions;

revoke all on function public._pin_verify(text, text) from public, anon, authenticated;
revoke all on function public._pin_set_or_verify(text, text) from public, anon, authenticated;
grant execute on function public.has_pin(text) to anon, authenticated;
grant execute on function public.visible_picks(text, text) to anon, authenticated;
grant execute on function public.save_picks(text, text, jsonb, boolean) to anon, authenticated;
grant execute on function public.submit_week(text, text, integer) to anon, authenticated;
