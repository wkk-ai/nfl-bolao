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
import { PinDialog } from "@/components/pin-dialog";
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
const PIN_KEY = "bolao-nfl-2026-pins";
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
  saveDraft: (
    gameId: string,
    weekId: number,
    winnerAbbr: string,
    marginBucket: MarginBucket,
  ) => Promise<SaveResult>;
  submitWeek: (weekId: number) => Promise<SaveResult>;
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

function readPin(player: PlayerId): string | null {
  if (typeof window === "undefined") return null;
  try {
    const parsed = JSON.parse(localStorage.getItem(PIN_KEY) || "{}") as Record<string, string>;
    const pin = parsed[player];
    return /^\d{4}$/.test(pin) ? pin : null;
  } catch {
    return null;
  }
}

function writePin(player: PlayerId, pin: string) {
  const parsed = (() => {
    try {
      return JSON.parse(localStorage.getItem(PIN_KEY) || "{}") as Record<string, string>;
    } catch {
      return {};
    }
  })();
  parsed[player] = pin;
  localStorage.setItem(PIN_KEY, JSON.stringify(parsed));
}

function clearPin(player: PlayerId) {
  try {
    const parsed = JSON.parse(localStorage.getItem(PIN_KEY) || "{}") as Record<string, string>;
    delete parsed[player];
    localStorage.setItem(PIN_KEY, JSON.stringify(parsed));
  } catch {
    localStorage.removeItem(PIN_KEY);
  }
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

function classifyWriteError(err: { message?: string } | null, justSetNewCode: boolean): {
  kind: "bad_pin" | "kickoff" | "other";
  message: string;
} {
  const msg = rpcMessage(err);
  if (msg.includes("bad_pin")) {
    if (justSetNewCode) {
      return {
        kind: "other",
        message: "Could not save after setting the code. Try again.",
      };
    }
    return { kind: "bad_pin", message: "Wrong code. Nothing was saved. Try again." };
  }
  if (msg.includes("kickoff_lock")) {
    return { kind: "kickoff", message: "Kickoff already hit. That pick was not saved." };
  }
  if (msg.includes("gen_salt") || msg.includes("crypt") || msg.includes("42883")) {
    return { kind: "other", message: "Could not save that draft. Try again in a moment." };
  }
  return { kind: "other", message: "Could not save that draft." };
}

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

async function loadBoard(player: PlayerId, pin: string | null) {
  const sb = getSupabase();
  if (!sb) return null;
  const picksArgs = { p_player: player, p_pin: pin ?? "" };
  const [weeksRes, gamesRes, picksRes, reactionsRes] = await Promise.all([
    sb.from("weeks").select("id,season,label,state").order("id"),
    sb.from("games").select(
      "id,week_id,kickoff,home_abbr,away_abbr,home_name,away_name,home_score,away_score,status,winner_abbr,margin,margin_bucket,venue",
    ),
    sb.rpc("visible_picks", picksArgs),
    sb.from("reactions").select("id,from_player_id,to_player_id,week_id,emoji,body").order("created_at"),
  ]);
  let pickRows = picksRes.data;
  let pickErr = picksRes.error;
  if (pickErr && rpcMessage(pickErr).includes("bad_pin")) {
    clearPin(player);
    const retry = await sb.rpc("visible_picks", { p_player: player, p_pin: "" });
    pickErr = retry.error;
    pickRows = retry.data;
  }
  const err = weeksRes.error || gamesRes.error || pickErr || reactionsRes.error;
  if (err) throw new Error(err.message);
  const weekRows = weeksRes.data ?? [];
  const gameRows = gamesRes.data ?? [];
  if (weekRows.length === 0 || gameRows.length === 0) {
    throw new Error("Shared board is empty.");
  }
  return {
    weeks: mapWeeks(weekRows as WeekRow[], gameRows as GameRow[]),
    picks: mapPicks((pickRows ?? []) as PickRow[]),
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
  const [pinOpen, setPinOpen] = useState(false);
  const [pinMode, setPinMode] = useState<"set" | "enter">("set");
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinBusy, setPinBusy] = useState(false);
  const pinResolver = useRef<(pin: string | null) => void>(() => {});

  const weeksRef = useRef(weeks);
  const playerRef = useRef(activePlayer);
  weeksRef.current = weeks;
  playerRef.current = activePlayer;

  const waitForPin = useCallback(() => {
    return new Promise<string | null>((resolve) => {
      pinResolver.current = resolve;
    });
  }, []);

  const askPin = useCallback(
    (mode: "set" | "enter") => {
      setPinMode(mode);
      setPinError(null);
      setPinBusy(false);
      setPinOpen(true);
      return waitForPin();
    },
    [waitForPin],
  );

  const dismissPin = useCallback(() => {
    setPinOpen(false);
    setPinBusy(false);
    setPinError(null);
  }, []);

  const onPinSubmit = useCallback((pin: string) => {
    setPinBusy(true);
    setPinError(null);
    pinResolver.current(pin);
  }, []);

  const onPinCancel = useCallback(() => {
    setPinOpen(false);
    setPinBusy(false);
    pinResolver.current(null);
  }, []);

  const pinForWrite = useCallback(
    async (player: PlayerId) => {
      const existing = readPin(player);
      const sb = getSupabase();
      if (!sb) return { pin: existing, mode: existing ? ("cached" as const) : ("set" as const) };
      const { data } = await sb.rpc("has_pin", { p_player: player });
      const has = Boolean(data);
      if (existing) return { pin: existing, mode: "cached" as const };
      const mode = has ? ("enter" as const) : ("set" as const);
      const pin = await askPin(mode);
      return { pin, mode };
    },
    [askPin],
  );

  const refresh = useCallback(async () => {
    const player = playerRef.current;
    const board = await loadBoard(player, readPin(player));
    if (!board) return;
    setWeeks(board.weeks);
    setPicks(board.picks);
    setReactions(board.reactions);
    setError(null);
  }, []);

  useEffect(() => {
    dropLegacyPracticePicks();
    setActivePlayerState(readPlayer());
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
  }, [configured, refresh]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(PLAYER_KEY, activePlayer);
  }, [hydrated, activePlayer]);

  useEffect(() => {
    if (!configured || !hydrated) return;
    void refresh().catch(() => setError("Could not refresh the shared board."));
  }, [activePlayer, configured, hydrated, refresh]);

  useEffect(() => {
    if (!configured) return;
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
    }, 20000);
    return () => {
      cancelled = true;
      window.clearInterval(poll);
      void sb.removeChannel(channel);
    };
  }, [configured, refresh]);

  const setActivePlayer = useCallback((id: PlayerId) => {
    setActivePlayerState(id);
  }, []);

  const saveDraft = useCallback(
    async (gameId: string, weekId: number, winnerAbbr: string, marginBucket: MarginBucket): Promise<SaveResult> => {
      const row: PickRecord = {
        playerId: activePlayer,
        gameId,
        weekId,
        winnerAbbr,
        marginBucket,
        submittedAt: null,
        draft: true,
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

      let { pin, mode } = await pinForWrite(activePlayer);
      while (true) {
        if (!pin) {
          dismissPin();
          return { ok: false, message: "Draft not saved. Enter the 4-digit code, then try again." };
        }
        const justSet = mode === "set";
        const { error: err } = await sb.rpc("save_picks", {
          p_player: activePlayer,
          p_pin: pin,
          p_picks: [
            {
              game_id: gameId,
              week_id: weekId,
              winner_abbr: winnerAbbr,
              margin_bucket: marginBucket,
            },
          ],
          p_submit: false,
        });
        if (!err) {
          writePin(activePlayer, pin);
          dismissPin();
          setPicks((prev) => {
            const next = prev.filter((p) => !(p.playerId === activePlayer && p.gameId === gameId));
            next.push(row);
            return next;
          });
          setError(null);
          return { ok: true };
        }
        const classified = classifyWriteError(err, justSet);
        clearPin(activePlayer);
        if (classified.kind === "bad_pin") {
          pin = null;
          mode = "enter";
          setPinBusy(false);
          setPinMode("enter");
          setPinError(classified.message);
          setPinOpen(true);
          pin = await waitForPin();
          continue;
        }
        dismissPin();
        setError(classified.message);
        return { ok: false, message: classified.message };
      }
    },
    [activePlayer, configured, dismissPin, pinForWrite, waitForPin],
  );

  const submitWeek = useCallback(
    async (weekId: number): Promise<SaveResult> => {
      const now = new Date().toISOString();
      const weekGameIds = new Set(
        weeksRef.current.find((w) => w.id === weekId)?.games.map((g) => g.id) ?? [],
      );
      if (!configured) {
        setPicks((prev) =>
          prev.map((p) =>
            p.playerId === activePlayer && weekGameIds.has(p.gameId)
              ? { ...p, draft: false, submittedAt: p.submittedAt ?? now }
              : p,
          ),
        );
        return { ok: true };
      }
      const sb = getSupabase();
      if (!sb) return { ok: false, message: "Could not reach the shared board." };

      let { pin, mode } = await pinForWrite(activePlayer);
      while (true) {
        if (!pin) {
          dismissPin();
          return { ok: false, message: "Submit did not land. Enter the 4-digit code, then try again." };
        }
        const justSet = mode === "set";
        const { error: err } = await sb.rpc("submit_week", {
          p_player: activePlayer,
          p_pin: pin,
          p_week: weekId,
        });
        if (!err) {
          writePin(activePlayer, pin);
          dismissPin();
          setPicks((prev) =>
            prev.map((p) =>
              p.playerId === activePlayer && weekGameIds.has(p.gameId) && !p.draft
                ? p
                : p.playerId === activePlayer && weekGameIds.has(p.gameId)
                  ? { ...p, draft: false, submittedAt: p.submittedAt ?? now }
                  : p,
            ),
          );
          setError(null);
          try {
            await refresh();
          } catch {
            /* local stamp already applied */
          }
          return { ok: true };
        }
        const classified = classifyWriteError(err, justSet);
        const message =
          classified.kind === "bad_pin"
            ? "Wrong code. The card was not submitted. Try again."
            : classified.kind === "kickoff"
              ? classified.message
              : "Could not submit that card.";
        clearPin(activePlayer);
        if (classified.kind === "bad_pin") {
          pin = null;
          mode = "enter";
          setPinBusy(false);
          setPinMode("enter");
          setPinError(message);
          setPinOpen(true);
          pin = await waitForPin();
          continue;
        }
        dismissPin();
        setError(message);
        return { ok: false, message };
      }
    },
    [activePlayer, configured, dismissPin, pinForWrite, refresh, waitForPin],
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
      ready: ready && hydrated,
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
      hydrated,
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

  return (
    <Ctx.Provider value={value}>
      {children}
      <PinDialog
        open={pinOpen}
        player={activePlayer}
        mode={pinMode}
        error={pinError}
        busy={pinBusy}
        onSubmit={onPinSubmit}
        onCancel={onPinCancel}
      />
    </Ctx.Provider>
  );
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("StoreProvider missing");
  return v;
}
