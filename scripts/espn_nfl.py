"""Parse ESPN's public NFL regular-season scoreboard."""

from __future__ import annotations

import json
import time
import urllib.request

SEASON = 2026
SEASON_TYPE = 2
WEEKS = range(1, 19)
URL = (
    "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard"
    f"?dates={SEASON}&seasontype={SEASON_TYPE}&week={{week}}"
)


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
    st = (event.get("status") or {}).get("type") or {}
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


def parse_event(event: dict) -> dict:
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
        raise ValueError(f"Missing teams in event {event.get('id')}")
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
    return {
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


def fetch_week(week: int) -> dict:
    req = urllib.request.Request(URL.format(week=week), headers={"User-Agent": "nfl-bolao-scores/1.1"})
    with urllib.request.urlopen(req, timeout=30) as res:
        return json.load(res)


def fetch_season() -> list[dict]:
    weeks = []
    for w in WEEKS:
        data = fetch_week(w)
        events = data.get("events") or []
        if not events:
            print(f"Week {w}: ESPN returned no games.")
            continue
        games = [parse_event(event) for event in events]
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
        print(f"Week {w}: {len(games)} games · {sum(1 for g in games if g['status']=='final')} final")
        time.sleep(0.15)
    return weeks
