import type { PickRecord, PlayerId, Reaction, SeedGame, SeedWeek, WeekState } from "./types";

export type WeekRow = {
  id: number;
  season: number;
  label: string;
  state: WeekState;
};

export type GameRow = {
  id: string;
  week_id: number;
  kickoff: string;
  home_abbr: string;
  away_abbr: string;
  home_name: string | null;
  away_name: string | null;
  home_score: number | null;
  away_score: number | null;
  status: SeedGame["status"];
  winner_abbr: string | null;
  margin: number | null;
  margin_bucket: SeedGame["marginBucket"];
  venue: string | null;
};

export type PickRow = {
  player_id: PlayerId;
  game_id: string;
  week_id: number;
  winner_abbr: string;
  margin_bucket: PickRecord["marginBucket"];
  submitted_at: string | null;
};

export type ReactionRow = {
  id: string;
  from_player_id: PlayerId;
  to_player_id: PlayerId;
  week_id: number;
  emoji: string | null;
  body: string;
};

export function mapGame(row: GameRow): SeedGame {
  return {
    id: row.id,
    kickoff: row.kickoff,
    status: row.status,
    homeAbbr: row.home_abbr,
    homeName: row.home_name ?? row.home_abbr,
    awayAbbr: row.away_abbr,
    awayName: row.away_name ?? row.away_abbr,
    homeScore: row.home_score,
    awayScore: row.away_score,
    winner: row.winner_abbr,
    margin: row.margin,
    marginBucket: row.margin_bucket,
    venue: row.venue,
  };
}

export function mapWeeks(weekRows: WeekRow[], gameRows: GameRow[]): SeedWeek[] {
  const byWeek = new Map<number, SeedGame[]>();
  for (const row of gameRows) {
    const list = byWeek.get(row.week_id) ?? [];
    list.push(mapGame(row));
    byWeek.set(row.week_id, list);
  }
  return [...weekRows]
    .sort((a, b) => a.id - b.id)
    .map((week) => ({
      id: week.id,
      label: week.label,
      season: week.season,
      state: week.state,
      games: (byWeek.get(week.id) ?? []).sort(
        (a, b) => +new Date(a.kickoff) - +new Date(b.kickoff) || a.id.localeCompare(b.id),
      ),
    }));
}

export function mapPicks(rows: PickRow[]): PickRecord[] {
  return rows.map((row) => ({
    playerId: row.player_id,
    gameId: row.game_id,
    weekId: row.week_id,
    winnerAbbr: row.winner_abbr,
    marginBucket: row.margin_bucket,
    submittedAt: row.submitted_at,
    draft: !row.submitted_at,
  }));
}

export function mapReactions(rows: ReactionRow[]): Reaction[] {
  return rows.map((row) => ({
    id: row.id,
    fromPlayerId: row.from_player_id,
    toPlayerId: row.to_player_id,
    weekId: row.week_id,
    emoji: row.emoji ?? "",
    body: row.body,
  }));
}

export function pickToRow(pick: PickRecord) {
  return {
    player_id: pick.playerId,
    game_id: pick.gameId,
    week_id: pick.weekId,
    winner_abbr: pick.winnerAbbr,
    margin_bucket: pick.marginBucket,
    submitted_at: pick.draft ? null : pick.submittedAt,
  };
}
