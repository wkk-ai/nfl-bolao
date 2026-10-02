"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import seed from "@/data/seed.json";
import { getSupabase, supabaseConfigured } from "./supabase";
import {
  mapPicks,
  mapReactions,
  mapWeeks,
  pickToRow,
  type GameRow,
  type PickRow,
  type ReactionRow,
  type WeekRow,
} from "./remote";
import type { MarginBucket, PickRecord, PlayerId, Reaction, SeedWeek } from "./types";

const STORAGE_KEY = "bolao-nfl-2026-v2";
const PLAYER_KEY = "bolao-nfl-2026-player";

type Persist = {
  activePlayer: PlayerId;
  extraPicks: PickRecord[];
  extraReactions: Reaction[];
};

type StoreValue = {
  ready: boolean;
  demo: boolean;
  error: string | null;
  activePlayer: PlayerId;
  setActivePlayer: (id: PlayerId) => void;
  weeks: SeedWeek[];
  picks: PickRecord[];
  reactions: Reaction[];
  saveDraft: (gameId: string, weekId: number, winnerAbbr: string, marginBucket: MarginBucket) => void;
  submitWeek: (weekId: number) => void;
  addReaction: (weekId: number, emoji: string, body: string) => void;
};

const Ctx = createContext<StoreValue | null>(null);

const seedWeeks = seed.weeks as SeedWeek[];
const seedPicks = seed.picks as PickRecord[];
const seedReactions = seed.reactions as Reaction[];

function loadPersist(): Persist {
  if (typeof window === "undefined") {
    return { activePlayer: "will", extraPicks: [], extraReactions: [] };
  }
  try {
    const playerOnly = localStorage.getItem(PLAYER_KEY);
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Persist) : null;
    const fromParsed = parsed?.activePlayer === "sara" ? "sara" : parsed?.activePlayer === "will" ? "will" : null;
    const fromPlayer = playerOnly === "sara" ? "sara" : playerOnly === "will" ? "will" : null;
    return {
      activePlayer: fromPlayer ?? fromParsed ?? "will",
      extraPicks: parsed?.extraPicks ?? [],
      extraReactions: parsed?.extraReactions ?? [],
    };
  } catch {
    return { activePlayer: "will", extraPicks: [], extraReactions: [] };
  }
}

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

function mergePicks(base: PickRecord[], extra: PickRecord[]): PickRecord[] {
  const map = new Map<string, PickRecord>();
  for (const p of base) map.set(`${p.playerId}:${p.gameId}`, p);
  for (const p of extra) map.set(`${p.playerId}:${p.gameId}`, p);
  return [...map.values()];
}

async function loadBoard() {
  const sb = getSupabase();
  if (!sb) return null;
  const [weeksRes, gamesRes, picksRes, reactionsRes] = await Promise.all([
    sb.from("weeks").select("id,season,label,state").order("id"),
    sb.from("games").select(
      "id,week_id,kickoff,home_abbr,away_abbr,home_name,away_name,home_score,away_score,status,winner_abbr,margin,margin_bucket,venue",
    ),
    sb.from("picks").select("player_id,game_id,week_id,winner_abbr,margin_bucket,submitted_at"),
    sb.from("reactions").select("id,from_player_id,to_player_id,week_id,emoji,body").order("created_at"),
  ]);
  const err = weeksRes.error || gamesRes.error || picksRes.error || reactionsRes.error;
  if (err) throw new Error(err.message);
  const weekRows = weeksRes.data ?? [];
  const gameRows = gamesRes.data ?? [];
  if (weekRows.length === 0 || gameRows.length === 0) {
    throw new Error("Shared board is empty.");
  }
  return {
    weeks: mapWeeks(weekRows as WeekRow[], gameRows as GameRow[]),
    picks: mapPicks((picksRes.data ?? []) as PickRow[]),
    reactions: mapReactions((reactionsRes.data ?? []) as ReactionRow[]),
  };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const ready = useIsClient();
  const configured = supabaseConfigured();
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePlayer, setActivePlayerState] = useState<PlayerId>("will");
  const [weeks, setWeeks] = useState<SeedWeek[]>(seedWeeks);
  const [picks, setPicks] = useState<PickRecord[]>(seedPicks);
  const [reactions, setReactions] = useState<Reaction[]>(seedReactions);

  const weeksRef = useRef(weeks);
  const picksRef = useRef(picks);
  weeksRef.current = weeks;
  picksRef.current = picks;

  useEffect(() => {
    const persist = loadPersist();
    setActivePlayerState(persist.activePlayer);

    if (!configured) {
      setPicks(mergePicks(seedPicks, persist.extraPicks));
      setReactions([...seedReactions, ...persist.extraReactions]);
      setHydrated(true);
      return;
    }

    let cancelled = false;

    async function boot() {
      try {
        const sb = getSupabase();
        if (sb && persist.extraPicks.length) {
          const { error: migrateErr } = await sb.from("picks").upsert(
            persist.extraPicks.map(pickToRow),
            { onConflict: "player_id,game_id" },
          );
          if (migrateErr) throw migrateErr;
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ activePlayer: persist.activePlayer, extraPicks: [], extraReactions: [] }),
          );
        }
        const board = await loadBoard();
        if (cancelled || !board) return;
        setWeeks(board.weeks);
        setPicks(board.picks);
        setReactions(board.reactions);
        setError(null);
      } catch {
        if (!cancelled) setError("Could not reach the shared board. Picks may not show up on the other phone yet.");
      } finally {
        if (!cancelled) setHydrated(true);
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [configured]);

  useEffect(() => {
    if (!hydrated || configured) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ activePlayer, extraPicks: picks.filter((p) => !seedPicks.includes(p)), extraReactions: reactions }),
    );
  }, [hydrated, configured, activePlayer, picks, reactions]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(PLAYER_KEY, activePlayer);
  }, [hydrated, activePlayer]);

  useEffect(() => {
    if (!configured) return;
    const sb = getSupabase();
    if (!sb) return;
    let cancelled = false;
    async function refresh() {
      try {
        const board = await loadBoard();
        if (cancelled || !board) return;
        setWeeks(board.weeks);
        setPicks(board.picks);
        setReactions(board.reactions);
        setError(null);
      } catch {
        if (!cancelled) setError("Could not refresh the shared board.");
      }
    }
    const channel = sb
      .channel("bolao-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "picks" }, () => {
        void refresh();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "reactions" }, () => {
        void refresh();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "games" }, () => {
        void refresh();
      })
      .subscribe();
    const poll = window.setInterval(() => {
      void refresh();
    }, 12000);
    return () => {
      cancelled = true;
      window.clearInterval(poll);
      void sb.removeChannel(channel);
    };
  }, [configured]);

  const setActivePlayer = useCallback((id: PlayerId) => {
    setActivePlayerState(id);
  }, []);

  const saveDraft = useCallback(
    (gameId: string, weekId: number, winnerAbbr: string, marginBucket: MarginBucket) => {
      const row: PickRecord = {
        playerId: activePlayer,
        gameId,
        weekId,
        winnerAbbr,
        marginBucket,
        submittedAt: null,
        draft: true,
      };
      setPicks((prev) => {
        const next = prev.filter((p) => !(p.playerId === activePlayer && p.gameId === gameId));
        next.push(row);
        return next;
      });
      const sb = getSupabase();
      if (!sb) return;
      void sb
        .from("picks")
        .upsert(pickToRow(row), { onConflict: "player_id,game_id" })
        .then(({ error: err }) => {
          if (err) setError("Could not save that pick to the shared board.");
        });
    },
    [activePlayer],
  );

  const submitWeek = useCallback(
    (weekId: number) => {
      const now = new Date().toISOString();
      const weekGameIds = new Set(
        weeksRef.current.find((w) => w.id === weekId)?.games.map((g) => g.id) ?? [],
      );
      let extras: PickRecord[] = [];
      setPicks((prev) => {
        extras = prev
          .filter((p) => p.playerId === activePlayer && weekGameIds.has(p.gameId))
          .map((p) => ({
            ...p,
            draft: false,
            submittedAt: p.submittedAt ?? now,
          }));
        const others = prev.filter(
          (p) => !(p.playerId === activePlayer && weekGameIds.has(p.gameId)),
        );
        return [...others, ...extras];
      });
      const sb = getSupabase();
      if (!sb || extras.length === 0) return;
      void sb
        .from("picks")
        .upsert(extras.map(pickToRow), { onConflict: "player_id,game_id" })
        .then(({ error: err }) => {
          if (err) setError("Could not lock that week on the shared board.");
        });
    },
    [activePlayer],
  );

  const addReaction = useCallback(
    (weekId: number, emoji: string, body: string) => {
      const to: PlayerId = activePlayer === "will" ? "sara" : "will";
      const row: Reaction = {
        id: `rx-${Date.now()}`,
        fromPlayerId: activePlayer,
        toPlayerId: to,
        weekId,
        emoji,
        body,
      };
      setReactions((prev) => [...prev, row]);
      const sb = getSupabase();
      if (!sb) return;
      void sb
        .from("reactions")
        .insert({
          from_player_id: row.fromPlayerId,
          to_player_id: row.toPlayerId,
          week_id: row.weekId,
          emoji: row.emoji,
          body: row.body,
        })
        .then(({ error: err }) => {
          if (err) setError("Could not post that note to the shared board.");
        });
    },
    [activePlayer],
  );

  const value = useMemo<StoreValue>(
    () => ({
      ready,
      demo: !configured,
      error,
      activePlayer,
      setActivePlayer,
      weeks,
      picks,
      reactions,
      saveDraft,
      submitWeek,
      addReaction,
    }),
    [
      ready,
      configured,
      error,
      activePlayer,
      weeks,
      picks,
      reactions,
      saveDraft,
      submitWeek,
      addReaction,
      setActivePlayer,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("StoreProvider missing");
  return v;
}
