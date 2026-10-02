-- Bolão NFL 2026 — Will vs Sara
-- Run this in the Supabase SQL editor (or via CLI) on a new project.

create table if not exists public.players (
  id text primary key,
  name text not null
);

create table if not exists public.weeks (
  id integer primary key,
  season integer not null default 2026,
  label text not null,
  state text not null
);

create table if not exists public.games (
  id text primary key,
  week_id integer not null references public.weeks (id) on delete cascade,
  kickoff timestamptz not null,
  home_abbr text not null,
  away_abbr text not null,
  home_name text,
  away_name text,
  home_score integer,
  away_score integer,
  status text not null,
  winner_abbr text,
  margin integer,
  margin_bucket integer,
  venue text
);

create table if not exists public.picks (
  id uuid primary key default gen_random_uuid(),
  player_id text not null references public.players (id),
  game_id text not null references public.games (id) on delete cascade,
  week_id integer not null references public.weeks (id),
  winner_abbr text not null,
  margin_bucket integer not null,
  submitted_at timestamptz,
  unique (player_id, game_id)
);

create table if not exists public.results (
  game_id text primary key references public.games (id) on delete cascade,
  winner_abbr text,
  margin integer,
  margin_bucket integer,
  home_score integer,
  away_score integer
);

create table if not exists public.reactions (
  id uuid primary key default gen_random_uuid(),
  from_player_id text not null references public.players (id),
  to_player_id text not null references public.players (id),
  week_id integer not null references public.weeks (id),
  emoji text,
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.players enable row level security;
alter table public.weeks enable row level security;
alter table public.games enable row level security;
alter table public.picks enable row level security;
alter table public.results enable row level security;
alter table public.reactions enable row level security;

create policy "public read players" on public.players for select using (true);
create policy "public read weeks" on public.weeks for select using (true);
create policy "public read games" on public.games for select using (true);
create policy "public read picks" on public.picks for select using (true);
create policy "public write picks" on public.picks for insert with check (true);
create policy "public update picks" on public.picks for update using (true);
create policy "public read results" on public.results for select using (true);
create policy "public read reactions" on public.reactions for select using (true);
create policy "public write reactions" on public.reactions for insert with check (true);

insert into public.players (id, name) values ('will', 'Will'), ('sara', 'Sara')
  on conflict (id) do nothing;
