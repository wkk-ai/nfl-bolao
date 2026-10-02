#!/usr/bin/env python3
"""Build src/data/seed.json from ESPN's public 2026 NFL regular-season scoreboard."""

from __future__ import annotations

import json
import time
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

SEASON = 2026
SEASON_TYPE = 2  # regular season
WEEKS = range(1, 19)
URL = (
    "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard"
    f"?dates={SEASON}&seasontype={SEASON_TYPE}&week={{week}}"
)
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "src" / "data" / "seed.json"


def bucket(margin: int | None) -> int | None:
    if margin is None or margin <= 0:
        return None
    if margin <= 7:
        return 5
    if margin <= 12:
        return 10
    if margin <= 17:
        return 15
    return 20


def status_of(event: dict) -> str:
    st = ((event.get("status") or {}).get("type") or {})
    name = (st.get("name") or "").upper()
    state = (st.get("state") or "").lower()
    if st.get("completed") or name == "STATUS_FINAL" or state == "post":
        return "final"
    if name in {
        "STATUS_IN_PROGRESS",
        "STATUS_HALFTIME",
        "STATUS_END_PERIOD",
        "STATUS_END_QUARTER",
    } or state == "in":
        return "in_progress"
    return "scheduled"


def parse_score(raw) -> int | None:
    if raw is None or raw == "":
        return None
    try:
        return int(raw)
    except (TypeError, ValueError):
        return None


def fetch_week(week: int) -> dict:
    req = urllib.request.Request(URL.format(week=week), headers={"User-Agent": "nfl-bolao-seed/1.0"})
    with urllib.request.urlopen(req, timeout=30) as res:
        return json.load(res)


def main() -> None:
    weeks = []
    for w in WEEKS:
        data = fetch_week(w)
        events = data.get("events") or []
        if not events:
            print(f"Week {w}: ESPN returned no games. Stopping here.")
            break
        games = []
        for event in events:
            comps = event.get("competitions") or [{}]
            c = comps[0]
            home = away = None
            for t in c.get("competitors") or []:
                team = t.get("team") or {}
                row = {
                    "abbr": team.get("abbreviation") or "",
                    "name": team.get("displayName") or team.get("name") or "",
                    "score": parse_score(t.get("score")),
                    "winner": t.get("winner") is True,
                }
                if t.get("homeAway") == "home":
                    home = row
                else:
                    away = row
            if not home or not away:
                raise SystemExit(f"Missing teams in week {w} event {event.get('id')}")
            st = status_of(event)
            home_score = home["score"] if st == "final" else None
            away_score = away["score"] if st == "final" else None
            winner = margin = mb = None
            if st == "final" and home_score is not None and away_score is not None:
                if home_score > away_score:
                    winner, margin = home["abbr"], home_score - away_score
                elif away_score > home_score:
                    winner, margin = away["abbr"], away_score - home_score
                else:
                    winner, margin = None, 0
                mb = bucket(margin)
            games.append(
                {
                    "id": str(event["id"]),
                    "kickoff": event["date"],
                    "status": st,
                    "homeAbbr": home["abbr"],
                    "homeName": home["name"],
                    "awayAbbr": away["abbr"],
                    "awayName": away["name"],
                    "homeScore": home_score,
                    "awayScore": away_score,
                    "winner": winner,
                    "margin": margin,
                    "marginBucket": mb,
                    "venue": (c.get("venue") or {}).get("fullName") or None,
                }
            )
        games.sort(key=lambda g: g["kickoff"])
        all_final = bool(games) and all(g["status"] == "final" for g in games)
        any_open = any(g["status"] == "scheduled" for g in games)
        any_final = any(g["status"] == "final" for g in games)
        if all_final:
            state = "final"
        elif any_final and any_open:
            state = "open"
        elif any_open:
            state = "upcoming"
        else:
            state = "locked"
        weeks.append({"id": w, "label": f"Week {w}", "season": SEASON, "state": state, "games": games})
        print(f"Week {w}: {len(games)} games")
        time.sleep(0.15)

    seed = {
        "season": SEASON,
        "source": "ESPN public NFL scoreboard (site.api.espn.com, seasontype=2 regular season)",
        "sourceUrl": URL,
        "asOf": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "startingPoints": 100,
        "players": [
            {"id": "will", "name": "Will", "short": "Will"},
            {"id": "sara", "name": "Sara", "short": "Sara"},
        ],
        "weeks": weeks,
        "picks": [],
        "reactions": [],
    }
    OUT.write_text(json.dumps(seed, indent=2) + "\n")
    games = sum(len(w["games"]) for w in weeks)
    finals = sum(1 for w in weeks for g in w["games"] if g["status"] == "final")
    print(f"Wrote {OUT} · {len(weeks)} weeks · {games} games · {finals} finals")


if __name__ == "__main__":
    main()
