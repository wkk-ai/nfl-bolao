#!/usr/bin/env python3
"""Build src/data/seed.json from ESPN's public 2026 NFL regular-season scoreboard."""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from espn_nfl import SEASON, URL, fetch_season  # noqa: E402

OUT = ROOT / "src" / "data" / "seed.json"


def main() -> None:
    weeks = fetch_season()
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
    ties = sum(
        1
        for w in weeks
        for g in w["games"]
        if g["status"] == "final" and g["winner"] is None and g["homeScore"] == g["awayScore"]
    )
    print(f"Wrote {OUT} · {len(weeks)} weeks · {games} games · {finals} finals · {ties} ties")


if __name__ == "__main__":
    main()
