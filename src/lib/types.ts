export type PlayerId = "will" | "sara";

export type MarginBucket = 5 | 10 | 15 | 20;

export type GameStatus = "scheduled" | "in_progress" | "final";

export type WeekState = "upcoming" | "open" | "locked" | "final";

export type Player = {
  id: PlayerId;
  name: string;
  short: string;
};

export type SeedGame = {
  id: string;
  kickoff: string;
  status: GameStatus;
  homeAbbr: string;
  homeName: string;
  awayAbbr: string;
  awayName: string;
  homeScore: number | null;
  awayScore: number | null;
  winner: string | null;
  margin: number | null;
  marginBucket: MarginBucket | null;
  venue: string | null;
};

export type SeedWeek = {
  id: number;
  label: string;
  season: number;
  state: WeekState;
  games: SeedGame[];
};

export type PickRecord = {
  playerId: PlayerId;
  gameId: string;
  weekId: number;
  winnerAbbr: string;
  marginBucket: MarginBucket;
  submittedAt: string | null;
  draft?: boolean;
};

export type Reaction = {
  id: string;
  fromPlayerId: PlayerId;
  toPlayerId: PlayerId;
  weekId: number;
  emoji: string;
  body: string;
};

export type PickScore = {
  winnerPts: number;
  marginPts: number;
  total: number;
  bucketOff: number | null;
  correctWinner: boolean;
  exactBucket: boolean;
};
