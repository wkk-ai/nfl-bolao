import type { MarginBucket, PickRecord, PickScore, SeedGame } from "./types";

export const MARGIN_BUCKETS: MarginBucket[] = [5, 10, 15, 20];
export const PERFECT_WEEK_BONUS = 10;

export function actualBucket(margin: number | null | undefined): MarginBucket | null {
  if (margin == null || margin <= 0) return null;
  if (margin <= 7) return 5;
  if (margin <= 12) return 10;
  if (margin <= 17) return 15;
  return 20;
}

export function bucketRange(bucket: MarginBucket): string {
  switch (bucket) {
    case 5:
      return "win by 1–7";
    case 10:
      return "win by 8–12";
    case 15:
      return "win by 13–17";
    case 20:
      return "win by 18 or more";
  }
}

export function bucketCopy(bucket: MarginBucket): { title: string; risk: string } {
  switch (bucket) {
    case 5:
      return {
        title: "A one-score scrap",
        risk: "Safest call. You are betting on a tight finish, not a parade.",
      };
    case 10:
      return {
        title: "They take control",
        risk: "A clean win. Not greedy, still worth the extra point if you nail it.",
      };
    case 15:
      return {
        title: "The game tilts away",
        risk: "Bigger swing. You want a two-score gap and no late drama.",
      };
    case 20:
      return {
        title: "Blowout energy",
        risk: "Highest risk, loudest brag. Miss the bucket and you still need the winner.",
      };
  }
}

export function bucketIndex(bucket: MarginBucket): number {
  return MARGIN_BUCKETS.indexOf(bucket);
}

export function scorePick(pick: PickRecord | undefined, game: SeedGame): PickScore | null {
  if (!pick || game.status !== "final" || !game.winner) return null;
  if (pick.winnerAbbr !== game.winner) {
    return {
      winnerPts: 0,
      marginPts: 0,
      total: 0,
      bucketOff: null,
      correctWinner: false,
      exactBucket: false,
    };
  }
  const actual = game.marginBucket ?? actualBucket(game.margin);
  if (actual == null) {
    return {
      winnerPts: 3,
      marginPts: 0,
      total: 3,
      bucketOff: null,
      correctWinner: true,
      exactBucket: false,
    };
  }
  const off = Math.abs(bucketIndex(pick.marginBucket) - bucketIndex(actual));
  const marginPts = off === 0 ? 2 : off === 1 ? 1 : 0;
  return {
    winnerPts: 3,
    marginPts,
    total: 3 + marginPts,
    bucketOff: off,
    correctWinner: true,
    exactBucket: off === 0,
  };
}

export function isKickoffLocked(kickoffIso: string, now = new Date()): boolean {
  return new Date(kickoffIso).getTime() <= now.getTime();
}
