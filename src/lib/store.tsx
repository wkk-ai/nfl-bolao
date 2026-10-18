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
import { SitePinGate } from "@/components/site-pin-gate";
import { dropLegacyPlayerPins, gateRemembered } from "./site-pin";
import { getSupabase, supabaseConfigured } from "./supabase";
import {
  mapPicks,
  mapReactions,
  mapWeeks,
  type GameRow,
  type PickRow,
  type ReactionRow,
  type WeekRow,
} from "./remote";
import type { MarginBucket, PickRecord, PlayerId, Reaction, SeedWeek } from "./types";

const PLAYER_KEY = "bolao-nfl-2026-player";
const LEGACY_KEY = "bolao-nfl-2026-v2";

export type SaveResult = { ok: true } | { ok: false; message: string };

type StoreValue = {
  ready: boolean;
  demo: boolean;
  error: string | null;
  activePlayer: PlayerId;
  setActivePlayer: (id: PlayerId) => void;
  weeks: SeedWeek[];
  picks: PickRecord[];
  reactions: Reaction[];
  savePick: (
    gameId: string,
    weekId: number,
    winnerAbbr: string,
    marginBucket: MarginBucket,
  ) => Promise<SaveResult>;
  addReaction: (weekId: number, emoji: string, body: string) => void;
};

const Ctx = createContext<StoreValue | null>(null);

const seedWeeks = seed.weeks as SeedWeek[];
const seedPicks = seed.picks as PickRecord[];
const seedReactions = seed.reactions as Reaction[];

function readPlayer(): PlayerId {
  if (typeof window === "undefined") return "will";
  const v = localStorage.getItem(PLAYER_KEY);
  return v === "sara" ? "sara" : "will";
}

function dropLegacyPracticePicks() {
  try {
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    /* ignore */
  }
}

function rpcMessage(err: { message?: string } | null): string {
  return (err?.message || "").toLowerCase();
}

function writeErrorMessage(err: { message?: string } | null): string {
  const msg = rpcMessage(err);
  if (msg.includes("kickoff_lock")) return "Kickoff already hit. That pick was not saved.";
  return "Could not save that pick.";
}

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

async function loadBoard(player: PlayerId) {
  const sb = getSupabase();
  if (!sb) return null;
  const [weeksRes, gamesRes, picksRes, reactionsRes] = await Promise.all([
    sb.from("weeks").select("id,season,label,state").order("id"),
    sb.from("games").select(
      "id,week_id,kickoff,home_abbr,away_abbr,home_name,away_name,home_score,away_score,status,winner_abbr,margin,margin_bucket,venue",
    ),
    sb.rpc("visible_picks", { p_player: player }),
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
  const client = useIsClient();
  const configured = supabaseConfigured();
  const [unlocked, setUnlocked] = useState(false);
  const [gateChecked, setGateChecked] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePlayer, setActivePlayerState] = useState<PlayerId>("will");
  const [weeks, setWeeks] = useState<SeedWeek[]>(seedWeeks);
  const [picks, setPicks] = useState<PickRecord[]>(seedPicks);
  const [reactions, setReactions] = useState<Reaction[]>(seedReactions);

  const playerRef = useRef(activePlayer);
  playerRef.current = activePlayer;

  const refresh = useCallback(async () => {
    const board = await loadBoard(playerRef.current);
    if (!board) return;
    setWeeks(board.weeks);
    setPicks(board.picks);
    setReactions(board.reactions);
    setError(null);
  }, []);

  useEffect(() => {
    dropLegacyPracticePicks();
    dropLegacyPlayerPins();
    setActivePlayerState(readPlayer());
    setUnlocked(gateRemembered());
    setGateChecked(true);
  }, []);

  useEffect(() => {
    if (!gateChecked || !unlocked) return;
    if (!configured) {
      setPicks(seedPicks);
      setReactions(seedReactions);
      setHydrated(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        await refresh();
      } catch {
        if (!cancelled) setError("Could not reach the shared board. Picks may not show up on the other phone yet.");
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [configured, gateChecked, refresh, unlocked]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(PLAYER_KEY, activePlayer);
  }, [hydrated, activePlayer]);

  useEffect(() => {
    if (!configured || !hydrated) return;
    void refresh().catch(() => setError("Could not refresh the shared board."));
  }, [activePlayer, configured, hydrated, refresh]);

  useEffect(() => {
    if (!configured || !unlocked) return;
    const sb = getSupabase();
    if (!sb) return;
    let cancelled = false;
    const channel = sb
      .channel("bolao-scores")
      .on("postgres_changes", { event: "*", schema: "public", table: "games" }, () => {
        if (!cancelled) void refresh();
      })
      .subscribe();
    const poll = window.setInterval(() => {
      if (!cancelled) void refresh();
    }, 15000);
    return () => {
      cancelled = true;
      window.clearInterval(poll);
      void sb.removeChannel(channel);
    };
  }, [configured, refresh, unlocked]);

  const setActivePlayer = useCallback((id: PlayerId) => {
    setActivePlayerState(id);
  }, []);

  const savePick = useCallback(
    async (gameId: string, weekId: number, winnerAbbr: string, marginBucket: MarginBucket): Promise<SaveResult> => {
      const now = new Date().toISOString();
      const row: PickRecord = {
        playerId: activePlayer,
        gameId,
        weekId,
        winnerAbbr,
        marginBucket,
        submittedAt: now,
      };
      if (!configured) {
        setPicks((prev) => {
          const next = prev.filter((p) => !(p.playerId === activePlayer && p.gameId === gameId));
          next.push(row);
          return next;
        });
        return { ok: true };
      }
      const sb = getSupabase();
      if (!sb) return { ok: false, message: "Could not reach the shared board." };
      const { error: err } = await sb.rpc("save_picks", {
        p_player: activePlayer,
        p_picks: [
          {
            game_id: gameId,
            week_id: weekId,
            winner_abbr: winnerAbbr,
            margin_bucket: marginBucket,
          },
        ],
        p_submit: true,
      });
      if (err) {
        const message = writeErrorMessage(err);
        setError(message);
        return { ok: false, message };
      }
      setPicks((prev) => {
        const next = prev.filter((p) => !(p.playerId === activePlayer && p.gameId === gameId));
        next.push(row);
        return next;
      });
      setError(null);
      try {
        await refresh();
      } catch {
        /* local stamp already applied */
      }
      return { ok: true };
    },
    [activePlayer, configured, refresh],
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
      ready: client && hydrated && unlocked,
      demo: !configured,
      error,
      activePlayer,
      setActivePlayer,
      weeks,
      picks,
      reactions,
      savePick,
      addReaction,
    }),
    [
      client,
      hydrated,
      unlocked,
      configured,
      error,
      activePlayer,
      weeks,
      picks,
      reactions,
      savePick,
      addReaction,
      setActivePlayer,
    ],
  );

  if (!client || !gateChecked) {
    return (
      <Ctx.Provider value={value}>
        <div className="min-h-dvh bg-[var(--turf)]" />
      </Ctx.Provider>
    );
  }

  if (!unlocked) {
    return <SitePinGate onUnlock={() => setUnlocked(true)} />;
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("StoreProvider missing");
  return v;
}
