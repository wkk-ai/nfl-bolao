import type {
  PickRecord,
  PlayerId,
  Reaction,
  SeedGame,
  SeedWeek,
} from "./types";
import { PERFECT_WEEK_BONUS, STARTING_POINTS, scorePick } from "./scoring";
import { deriveWeekState, gameLocked } from "./week-state";
import { teamLabel } from "./teams";

export type GameView = SeedGame & {
  locked: boolean;
  willPick?: PickRecord;
  saraPick?: PickRecord;
};

export type WeekAward = {
  id: string;
  title: string;
  detail: string;
  playerId?: PlayerId;
};

export type Badge = {
  id: string;
  title: string;
  detail: string;
  playerId: PlayerId;
  earned: boolean;
};

export function pickFor(
  picks: PickRecord[],
  playerId: PlayerId,
  gameId: string,
): PickRecord | undefined {
  return picks.find((p) => p.playerId === playerId && p.gameId === gameId && !p.draft);
}

export function draftOrPick(
  picks: PickRecord[],
  playerId: PlayerId,
  gameId: string,
): PickRecord | undefined {
  const draft = picks.find((p) => p.playerId === playerId && p.gameId === gameId && p.draft);
  return draft ?? pickFor(picks, playerId, gameId);
}

export function weekGames(week: SeedWeek, picks: PickRecord[], now = new Date()): GameView[] {
  return week.games.map((g) => ({
    ...g,
    locked: gameLocked(g, now),
    willPick: draftOrPick(picks, "will", g.id),
    saraPick: draftOrPick(picks, "sara", g.id),
  }));
}

export function weekPoints(
  week: SeedWeek,
  picks: PickRecord[],
  playerId: PlayerId,
): { gamePts: number; bonus: number; total: number; winnersHit: number; gamesFinal: number } {
  let gamePts = 0;
  let winnersHit = 0;
  let gamesFinal = 0;
  for (const game of week.games) {
    if (game.status !== "final") continue;
    gamesFinal += 1;
    const pick = pickFor(picks, playerId, game.id);
    const scored = scorePick(pick, game);
    if (scored) {
      gamePts += scored.total;
      if (scored.correctWinner) winnersHit += 1;
    }
  }
  const bonus =
    gamesFinal > 0 && winnersHit === gamesFinal && week.games.some((g) => pickFor(picks, playerId, g.id))
      ? PERFECT_WEEK_BONUS
      : 0;
  return { gamePts, bonus, total: gamePts + bonus, winnersHit, gamesFinal };
}

export function seasonTotals(weeks: SeedWeek[], picks: PickRecord[]) {
  const byPlayer: Record<PlayerId, { total: number; byWeek: { weekId: number; pts: number }[] }> = {
    will: { total: STARTING_POINTS, byWeek: [] },
    sara: { total: STARTING_POINTS, byWeek: [] },
  };
  for (const week of weeks) {
    for (const id of ["will", "sara"] as PlayerId[]) {
      const w = weekPoints(week, picks, id);
      byPlayer[id].byWeek.push({ weekId: week.id, pts: w.total });
      byPlayer[id].total += w.total;
    }
  }
  return byPlayer;
}

export function winnerStreak(weeks: SeedWeek[], picks: PickRecord[], playerId: PlayerId): number {
  const finals = weeks
    .flatMap((w) => w.games.map((g) => ({ week: w, game: g })))
    .filter((x) => x.game.status === "final")
    .sort((a, b) => +new Date(a.game.kickoff) - +new Date(b.game.kickoff));
  let streak = 0;
  for (let i = finals.length - 1; i >= 0; i--) {
    const pick = pickFor(picks, playerId, finals[i].game.id);
    if (!pick) continue;
    const scored = scorePick(pick, finals[i].game);
    if (scored?.correctWinner) streak += 1;
    else break;
  }
  return streak;
}

export function unpickedOpenGames(
  week: SeedWeek,
  picks: PickRecord[],
  playerId: PlayerId,
  now = new Date(),
): SeedGame[] {
  return week.games.filter((g) => {
    if (gameLocked(g, now)) return false;
    const p = draftOrPick(picks, playerId, g.id);
    return !p;
  });
}

export function weeklyAwards(week: SeedWeek, picks: PickRecord[]): WeekAward[] {
  const awards: WeekAward[] = [];
  if (week.games.every((g) => g.status !== "final")) return awards;

  type Row = { playerId: PlayerId; game: SeedGame; total: number; exact: boolean };
  const rows: Row[] = [];
  for (const playerId of ["will", "sara"] as PlayerId[]) {
    for (const game of week.games) {
      if (game.status !== "final") continue;
      const scored = scorePick(pickFor(picks, playerId, game.id), game);
      if (!scored) continue;
      rows.push({ playerId, game, total: scored.total, exact: scored.exactBucket });
    }
  }
  const best = [...rows].sort((a, b) => b.total - a.total || (b.exact ? 1 : 0) - (a.exact ? 1 : 0))[0];
  if (best && best.total > 0) {
    awards.push({
      id: "best-pick",
      title: "Best pick",
      playerId: best.playerId,
      detail: `${best.playerId === "will" ? "Will" : "Sara"} banked ${best.total} pts on ${teamLabel(best.game.winner ?? "")}.`,
    });
  }
  const nail = rows.find((r) => r.exact && (r.game.margin ?? 99) <= 3 && r.total >= 5);
  if (nail) {
    awards.push({
      id: "rough-beat",
      title: "Rough beat / nail-biter",
      playerId: nail.playerId,
      detail: `${nail.playerId === "will" ? "Will" : "Sara"} called a ${nail.game.margin}-point win. That's a field-goal week.`,
    });
  }
  for (const id of ["will", "sara"] as PlayerId[]) {
    const w = weekPoints(week, picks, id);
    if (w.bonus > 0) {
      awards.push({
        id: `perfect-${id}`,
        title: "Perfect week",
        playerId: id,
        detail: `${id === "will" ? "Will" : "Sara"} hit every winner. +${w.bonus} bonus.`,
      });
    }
  }
  return awards;
}

export function badgesFor(
  weeks: SeedWeek[],
  picks: PickRecord[],
  reactions: Reaction[],
  playerId: PlayerId,
): Badge[] {
  const name = playerId === "will" ? "Will" : "Sara";
  const finals = weeks.flatMap((w) => w.games).filter((g) => g.status === "final");
  let exact = 0;
  let correct = 0;
  let twenties = 0;
  let fives = 0;
  let maxStreak = 0;
  let run = 0;
  const ordered = [...finals].sort((a, b) => +new Date(a.kickoff) - +new Date(b.kickoff));
  for (const game of ordered) {
    const pick = pickFor(picks, playerId, game.id);
    if (!pick) continue;
    const scored = scorePick(pick, game);
    if (scored?.correctWinner) {
      correct += 1;
      run += 1;
      maxStreak = Math.max(maxStreak, run);
    } else {
      run = 0;
    }
    if (scored?.exactBucket) exact += 1;
    if (pick.marginBucket === 20) twenties += 1;
    if (pick.marginBucket === 5) fives += 1;
  }
  const perfectWeeks = weeks.filter((w) => weekPoints(w, picks, playerId).bonus > 0).length;
  const totals = seasonTotals(weeks, picks);
  const leading = totals[playerId].total > totals[playerId === "will" ? "sara" : "will"].total;
  const talk = reactions.filter((r) => r.fromPlayerId === playerId).length;

  return [
    {
      id: "first-blood",
      title: "First blood",
      detail: "At least one correct winner on the board.",
      playerId,
      earned: correct >= 1,
    },
    {
      id: "hot-streak",
      title: "On a heater",
      detail: "Three correct winners in a row.",
      playerId,
      earned: maxStreak >= 3,
    },
    {
      id: "perfect-week",
      title: "Clean slate",
      detail: "Every winner in a finished week.",
      playerId,
      earned: perfectWeeks >= 1,
    },
    {
      id: "close-call",
      title: "Field-goal merchant",
      detail: "Five or more 1–7 margin calls.",
      playerId,
      earned: fives >= 5,
    },
    {
      id: "big-swing",
      title: "Blowout believer",
      detail: "Three 18+ margin calls.",
      playerId,
      earned: twenties >= 3,
    },
    {
      id: "sharpshooter",
      title: "Bucket sniper",
      detail: "Eight exact margin buckets.",
      playerId,
      earned: exact >= 8,
    },
    {
      id: "leader",
      title: "Wearing the yellow jersey",
      detail: "Ahead in season points right now.",
      playerId,
      earned: leading,
    },
    {
      id: "trash",
      title: "Needler",
      detail: `${name} sent two or more reactions.`,
      playerId,
      earned: talk >= 2,
    },
  ];
}

export function bestPickOfWeek(week: SeedWeek, picks: PickRecord[], playerId: PlayerId) {
  let best: { game: SeedGame; total: number } | null = null;
  for (const game of week.games) {
    const scored = scorePick(pickFor(picks, playerId, game.id), game);
    if (!scored) continue;
    if (!best || scored.total > best.total) best = { game, total: scored.total };
  }
  return best;
}

export type RankRow = {
  playerId: PlayerId;
  name: string;
  pts: number;
  rank: number;
  tied: boolean;
};

export function ranked(weeks: SeedWeek[], picks: PickRecord[]): RankRow[] {
  const t = seasonTotals(weeks, picks);
  const rows = [
    { playerId: "will" as const, name: "Will", pts: t.will.total },
    { playerId: "sara" as const, name: "Sara", pts: t.sara.total },
  ].sort((a, b) => b.pts - a.pts);
  const tied = rows[0].pts === rows[1].pts;
  return rows.map((r, i) => ({
    ...r,
    rank: tied ? 1 : i + 1,
    tied,
  }));
}

export function currentWeek(weeks: SeedWeek[], now = new Date()): SeedWeek {
  const open = weeks.find((w) => deriveWeekState(w, now) === "open");
  if (open) return open;
  const locked = weeks.find((w) => deriveWeekState(w, now) === "locked");
  if (locked) return locked;
  return weeks[weeks.length - 1];
}
