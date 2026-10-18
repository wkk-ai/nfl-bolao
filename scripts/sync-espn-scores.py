#!/usr/bin/env python3
"""Update existing games from ESPN. Does not touch picks, players, or weeks."""

from __future__ import annotations

import os
import sys

import psycopg
from espn_nfl import fetch_season


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
    )


def main() -> None:
    weeks = fetch_season()
    games = [g for w in weeks for g in w["games"]]
    conn = connect()
    updated = 0
    skipped = 0
    missing = 0
    finals = 0
    ties = 0
    try:
        with conn.cursor() as cur:
            for g in games:
                cur.execute("select status from public.games where id = %s", (g["id"],))
                row = cur.fetchone()
                if not row:
                    missing += 1
                    continue
                current = row[0]
                if current == "final" and g["status"] != "final":
                    skipped += 1
                    continue
                cur.execute(
                    """
                    update public.games set
                      status = %s,
                      home_score = %s,
                      away_score = %s,
                      winner_abbr = %s,
                      margin = %s,
                      margin_bucket = %s
                    where id = %s
                    """,
                    (
                        g["status"],
                        g["homeScore"],
                        g["awayScore"],
                        g["winner"],
                        g["margin"],
                        g["marginBucket"],
                        g["id"],
                    ),
                )
                updated += cur.rowcount
            cur.execute("select count(*) from public.games where status = 'final'")
            finals = cur.fetchone()[0]
            cur.execute(
                """
                select count(*) from public.games
                where status = 'final' and winner_abbr is null and home_score is not null
                  and home_score = away_score
                """
            )
            ties = cur.fetchone()[0]
        conn.commit()
    finally:
        conn.close()
    print(
        "sync_ok",
        "updated",
        updated,
        "skipped_downgrade",
        skipped,
        "missing_ids",
        missing,
        "finals",
        finals,
        "ties",
        ties,
    )


if __name__ == "__main__":
    main()
