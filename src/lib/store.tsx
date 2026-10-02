"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import seed from "@/data/seed.json";
import { getSupabase, supabaseConfigured } from "./supabase";
import type { MarginBucket, PickRecord, PlayerId, Reaction, SeedWeek } from "./types";

const STORAGE_KEY = "bolao-nfl-2026-v1";

type Persist = {
  activePlayer: PlayerId;
  extraPicks: PickRecord[];
  extraReactions: Reaction[];
};

type StoreValue = {
  ready: boolean;
  demo: boolean;
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
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { activePlayer: "will", extraPicks: [], extraReactions: [] };
    const parsed = JSON.parse(raw) as Persist;
    return {
      activePlayer: parsed.activePlayer === "sara" ? "sara" : "will",
      extraPicks: parsed.extraPicks ?? [],
      extraReactions: parsed.extraReactions ?? [],
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

function mergePicks(extra: PickRecord[]): PickRecord[] {
  const map = new Map<string, PickRecord>();
  for (const p of seedPicks) map.set(`${p.playerId}:${p.gameId}`, p);
  for (const p of extra) map.set(`${p.playerId}:${p.gameId}`, p);
  return [...map.values()];
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const ready = useIsClient();
  const [hydrated, setHydrated] = useState(false);
  const [activePlayer, setActivePlayerState] = useState<PlayerId>("will");
  const [extraPicks, setExtraPicks] = useState<PickRecord[]>([]);
  const [extraReactions, setExtraReactions] = useState<Reaction[]>([]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- hydrate local demo store once */
    const p = loadPersist();
    setActivePlayerState(p.activePlayer);
    setExtraPicks(p.extraPicks);
    setExtraReactions(p.extraReactions);
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const payload: Persist = { activePlayer, extraPicks, extraReactions };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    const sb = getSupabase();
    if (!sb) return;
    void sb.from("picks").upsert(
      extraPicks
        .filter((p) => !p.draft)
        .map((p) => ({
          player_id: p.playerId,
          game_id: p.gameId,
          week_id: p.weekId,
          winner_abbr: p.winnerAbbr,
          margin_bucket: p.marginBucket,
          submitted_at: p.submittedAt,
        })),
      { onConflict: "player_id,game_id" },
    );
  }, [ready, activePlayer, extraPicks, extraReactions]);

  const setActivePlayer = useCallback((id: PlayerId) => {
    setActivePlayerState(id);
  }, []);

  const saveDraft = useCallback(
    (gameId: string, weekId: number, winnerAbbr: string, marginBucket: MarginBucket) => {
      setExtraPicks((prev) => {
        const next = prev.filter((p) => !(p.playerId === activePlayer && p.gameId === gameId));
        next.push({
          playerId: activePlayer,
          gameId,
          weekId,
          winnerAbbr,
          marginBucket,
          submittedAt: null,
          draft: true,
        });
        return next;
      });
    },
    [activePlayer],
  );

  const submitWeek = useCallback(
    (weekId: number) => {
      const now = new Date().toISOString();
      setExtraPicks((prev) => {
        const merged = mergePicks(prev);
        const weekGameIds = new Set(
          seedWeeks.find((w) => w.id === weekId)?.games.map((g) => g.id) ?? [],
        );
        const extras = merged
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
      setExtraReactions((prev) => [...prev, row]);
    },
    [activePlayer],
  );

  const value = useMemo<StoreValue>(
    () => ({
      ready,
      demo: !supabaseConfigured(),
      activePlayer,
      setActivePlayer,
      weeks: seedWeeks,
      picks: mergePicks(extraPicks),
      reactions: [...seedReactions, ...extraReactions],
      saveDraft,
      submitWeek,
      addReaction,
    }),
    [ready, activePlayer, extraPicks, extraReactions, saveDraft, submitWeek, addReaction, setActivePlayer],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("StoreProvider missing");
  return v;
}
