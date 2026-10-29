import type { PickRecord, PlayerId, SeedGame, SeedWeek } from "./types";
import { gameLocked } from "./week-state";

export function revealReady(picks: PickRecord[], gameId: string): boolean {
  let will = false;
  let sara = false;
  for (const pick of picks) {
    if (pick.gameId !== gameId) continue;
    if (pick.playerId === "will") will = true;
    if (pick.playerId === "sara") sara = true;
  }
  return will && sara;
}

export function concealGame(game: SeedGame, picks: PickRecord[]): SeedGame {
  if (game.scoresPublic) return game;
  if (revealReady(picks, game.id)) return game;
  const hasResult =
    game.status === "final" ||
    game.homeScore != null ||
    game.awayScore != null ||
    game.winner != null ||
    game.margin != null ||
    game.marginBucket != null;
  if (!hasResult) return game;
  return {
    ...game,
    status: game.status === "final" ? "in_progress" : game.status,
    homeScore: null,
    awayScore: null,
    winner: null,
    margin: null,
    marginBucket: null,
  };
}

export function concealWeeks(weeks: SeedWeek[], picks: PickRecord[]): SeedWeek[] {
  return weeks.map((week) => ({
    ...week,
    games: week.games.map((game) => concealGame(game, picks)),
  }));
}

export function canEditPick(
  game: SeedGame,
  picks: PickRecord[],
  playerId: PlayerId,
  now = new Date(),
): boolean {
  const mine = picks.some((pick) => pick.playerId === playerId && pick.gameId === game.id);
  const started = gameLocked(game, now);
  if (!mine) {
    if (game.scoresPublic) return !started;
    return true;
  }
  return !started;
}
