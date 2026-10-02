#!/usr/bin/env python3
"""Apply supabase/migrations, then upsert the ESPN slate. No picks.

Env: PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE. sslmode=require.
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

import psycopg
from psycopg.rows import dict_row

ROOT = Path(__file__).resolve().parents[1]
MIGRATIONS = ROOT / "supabase" / "migrations"
SEED_PATH = ROOT / "src" / "data" / "seed.json"


def connect():
    missing = [k for k in ("PGHOST", "PGUSER", "PGPASSWORD") if not os.environ.get(k)]
    if missing:
        print("missing env", ",".join(missing), file=sys.stderr)
        sys.exit(1)
    return psycopg.connect(
        host=os.environ["PGHOST"],
        port=int(os.environ.get("PGPORT", "5432")),
        user=os.environ["PGUSER"],
        password=os.environ["PGPASSWORD"],
        dbname=os.environ.get("PGDATABASE", "postgres"),
        sslmode="require",
        connect_timeout=15,
        row_factory=dict_row,
    )


def apply_sql(conn, path: Path) -> None:
    sql = path.read_text()
    with conn.cursor() as cur:
        cur.execute(sql)
    print("applied", path.name)


def seed(conn) -> None:
    seed = json.loads(SEED_PATH.read_text())
    weeks = seed["weeks"]
    with conn.cursor() as cur:
        cur.execute(
            """
            insert into public.players (id, name) values ('will', 'Will'), ('sara', 'Sara')
            on conflict (id) do update set name = excluded.name
            """
        )
        for week in weeks:
            cur.execute(
                """
                insert into public.weeks (id, season, label, state)
                values (%s, %s, %s, %s)
                on conflict (id) do update set
                  season = excluded.season,
                  label = excluded.label,
                  state = excluded.state
                """,
                (week["id"], week["season"], week["label"], week["state"]),
            )
        game_rows = []
        result_rows = []
        for week in weeks:
            for g in week["games"]:
                game_rows.append(
                    (
                        g["id"],
                        week["id"],
                        g["kickoff"],
                        g["homeAbbr"],
                        g["awayAbbr"],
                        g.get("homeName"),
                        g.get("awayName"),
                        g.get("homeScore"),
                        g.get("awayScore"),
                        g["status"],
                        g.get("winner"),
                        g.get("margin"),
                        g.get("marginBucket"),
                        g.get("venue"),
                    )
                )
                if g["status"] == "final":
                    result_rows.append(
                        (
                            g["id"],
                            g.get("winner"),
                            g.get("margin"),
                            g.get("marginBucket"),
                            g.get("homeScore"),
                            g.get("awayScore"),
                        )
                    )
        cur.executemany(
            """
            insert into public.games (
              id, week_id, kickoff, home_abbr, away_abbr, home_name, away_name,
              home_score, away_score, status, winner_abbr, margin, margin_bucket, venue
            ) values (
              %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            )
            on conflict (id) do update set
              week_id = excluded.week_id,
              kickoff = excluded.kickoff,
              home_abbr = excluded.home_abbr,
              away_abbr = excluded.away_abbr,
              home_name = excluded.home_name,
              away_name = excluded.away_name,
              home_score = excluded.home_score,
              away_score = excluded.away_score,
              status = excluded.status,
              winner_abbr = excluded.winner_abbr,
              margin = excluded.margin,
              margin_bucket = excluded.margin_bucket,
              venue = excluded.venue
            """,
            game_rows,
        )
        if result_rows:
            cur.executemany(
                """
                insert into public.results (
                  game_id, winner_abbr, margin, margin_bucket, home_score, away_score
                ) values (%s, %s, %s, %s, %s, %s)
                on conflict (game_id) do update set
                  winner_abbr = excluded.winner_abbr,
                  margin = excluded.margin,
                  margin_bucket = excluded.margin_bucket,
                  home_score = excluded.home_score,
                  away_score = excluded.away_score
                """,
                result_rows,
            )
        cur.execute("select count(*) as n from public.weeks")
        weeks_n = cur.fetchone()["n"]
        cur.execute("select count(*) as n from public.games")
        games_n = cur.fetchone()["n"]
        cur.execute("select count(*) as n from public.games where status = 'final'")
        finals_n = cur.fetchone()["n"]
        cur.execute("select count(*) as n from public.picks")
        picks_n = cur.fetchone()["n"]
        cur.execute("select id, name from public.players order by id")
        players = list(cur.fetchall())
    print(
        "seeded",
        "weeks",
        weeks_n,
        "games",
        games_n,
        "finals",
        finals_n,
        "picks",
        picks_n,
        "players",
        ",".join(p["name"] for p in players),
    )


def main() -> None:
    conn = connect()
    conn.autocommit = True
    try:
        for path in sorted(MIGRATIONS.glob("*.sql")):
            apply_sql(conn, path)
        seed(conn)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
