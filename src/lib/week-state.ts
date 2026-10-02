import { isKickoffLocked } from "./scoring";
import type { SeedGame, SeedWeek, WeekState } from "./types";

export function gameLocked(game: SeedGame, now = new Date()): boolean {
  return game.status === "final" || isKickoffLocked(game.kickoff, now);
}

export function deriveWeekState(week: SeedWeek, now = new Date()): WeekState {
  const games = week.games;
  if (games.length === 0) return week.state;
  const allFinal = games.every((g) => g.status === "final");
  if (allFinal) return "final";
  const anyOpen = games.some((g) => !gameLocked(g, now));
  if (anyOpen) {
    const noneLocked = games.every((g) => !gameLocked(g, now));
    return noneLocked ? "upcoming" : "open";
  }
  return "locked";
}

export function weekStateLabel(state: WeekState): string {
  switch (state) {
    case "upcoming":
      return "Upcoming";
    case "open":
      return "Open";
    case "locked":
      return "Locked";
    case "final":
      return "Final";
  }
}
