"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TeamLogo } from "@/components/team-logo";
import { ButtonLink } from "@/components/button-link";
import { ErrorState, PageLoading } from "@/components/states";
import { useStore } from "@/lib/store";
import { bucketCopy, bucketRange, MARGIN_BUCKETS } from "@/lib/scoring";
import { gameLocked } from "@/lib/week-state";
import { formatKickoff, formatLockedAt } from "@/lib/format";
import { nextOpenGame, pickFor, weekListHref } from "@/lib/compute";
import type { MarginBucket } from "@/lib/types";
import { cn } from "@/lib/utils";
import { teamMeta } from "@/lib/teams";
import { toast } from "sonner";

export default function PickPage({
  params,
}: {
  params: Promise<{ week: string; gameId: string }>;
}) {
  const { week: weekParam, gameId } = use(params);
  const weekId = Number(weekParam);
  const router = useRouter();
  const { ready, weeks, picks, activePlayer, savePick } = useStore();
  const [saving, setSaving] = useState<"pick" | "next" | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const week = weeks.find((w) => w.id === weekId);
  const game = week?.games.find((g) => g.id === gameId);
  const existing = game ? pickFor(picks, activePlayer, game.id) : undefined;
  const [winner, setWinner] = useState<string | undefined>(existing?.winnerAbbr);
  const [bucket, setBucket] = useState<MarginBucket | undefined>(existing?.marginBucket);

  useEffect(() => {
    if (!existing) return;
    setWinner((w) => w ?? existing.winnerAbbr);
    setBucket((b) => b ?? existing.marginBucket);
  }, [existing]);

  const locked = game ? gameLocked(game) : true;
  const step = winner ? 2 : 1;

  const teams = useMemo(() => {
    if (!game) return [];
    return [
      { abbr: game.awayAbbr, name: game.awayName, side: "Away" },
      { abbr: game.homeAbbr, name: game.homeName, side: "Home" },
    ];
  }, [game]);

  if (!ready) return <PageLoading />;
  if (!week || !game) return <ErrorState title="Game missing" body="That matchup is not on this week’s card." />;

  if (locked) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-medium text-amber-200 sm:text-3xl">This game is locked</h1>
        <p className="text-zinc-400">
          {formatLockedAt(game.kickoff)}. You cannot change a pick after the ball is in the air.
        </p>
        <ButtonLink href={`/weeks/${weekId}`}>Back to matchups</ButtonLink>
        <div className="h-24 md:hidden" aria-hidden />
      </div>
    );
  }

  async function persist(mode: "pick" | "next") {
    if (!winner || !bucket || saving || !week || !game) return;
    const next = mode === "next" ? nextOpenGame(week, picks, activePlayer, game.id) : undefined;
    setSaving(mode);
    setSaveError(null);
    const result = await savePick(game.id, weekId, winner, bucket);
    setSaving(null);
    if (!result.ok) {
      setSaveError(result.message);
      return;
    }
    toast.success("Saved");
    if (mode === "next" && next) {
      router.push(`/weeks/${weekId}/pick/${next.id}`);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium text-zinc-500">
          Step {step} of 2 · locks {formatKickoff(game.kickoff)}
        </p>
        <h1 className="text-2xl font-medium text-amber-200 sm:text-3xl">Make the call</h1>
        <p className="text-zinc-400">First the winner. Then how ugly you think the score gets.</p>
      </div>
      <div className="flex items-center justify-center gap-6">
        <TeamLogo abbr={game.awayAbbr} size={72} />
        <span className="text-zinc-500">at</span>
        <TeamLogo abbr={game.homeAbbr} size={72} />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {teams.map((t) => {
          const meta = teamMeta(t.abbr);
          const on = winner === t.abbr;
          return (
            <button
              key={t.abbr}
              type="button"
              onClick={() => setWinner(t.abbr)}
              className={cn(
                "min-h-16 touch-manipulation rounded-xl border p-4 text-left transition",
                on ? "border-amber-300 bg-amber-300/10" : "border-white/10 bg-black/40",
              )}
              style={{ boxShadow: on ? `inset 0 0 0 1px ${meta.primary}` : undefined }}
            >
              <div className="flex items-center gap-3">
                <TeamLogo abbr={t.abbr} size={48} />
                <div>
                  <div className="text-xs text-zinc-500">{t.side}</div>
                  <div className="text-xl font-medium">{t.abbr}</div>
                  <div className="text-sm text-zinc-400">{t.name}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      {winner ? (
        <div className="space-y-3">
          <h2 className="text-xl font-medium">Winning margin</h2>
          <p className="text-sm text-zinc-400">
            These are buckets, not exact scores. 5 = {bucketRange(5)}. 10 = {bucketRange(10)}. 15 ={" "}
            {bucketRange(15)}. 20 = {bucketRange(20)}.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {MARGIN_BUCKETS.map((b) => {
              const copy = bucketCopy(b);
              const on = bucket === b;
              return (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBucket(b)}
                  className={cn(
                    "min-h-20 touch-manipulation rounded-xl border p-4 text-left",
                    on ? "border-amber-300 bg-amber-300/10" : "border-white/10 bg-black/40",
                    b === 20 && "ring-1 ring-red-400/30",
                  )}
                >
                  <div className="text-2xl font-medium">{b}</div>
                  <div className="text-sm text-amber-200">{copy.title}</div>
                  <div className="text-xs text-zinc-400">{bucketRange(b)}</div>
                  <p className="mt-2 text-sm text-zinc-300">{copy.risk}</p>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <Card className="border-white/10 bg-black/30 p-4 text-sm text-zinc-400">
          Choose a winner to unlock the margin buckets.
        </Card>
      )}
      <div className="flex flex-col gap-2 pb-28 md:flex-row md:flex-wrap md:pb-0">
        <Button
          disabled={!winner || !bucket || saving !== null}
          className="h-12 min-h-12 w-full bg-amber-400 text-black hover:bg-amber-300 md:w-auto"
          onClick={() => void persist("pick")}
        >
          {saving === "pick" ? "Saving…" : "Save pick"}
        </Button>
        <Button
          disabled={!winner || !bucket || saving !== null}
          variant="secondary"
          className="h-12 min-h-12 w-full border border-amber-300/40 bg-amber-300/10 text-amber-100 hover:bg-amber-300/20 md:w-auto"
          onClick={() => void persist("next")}
        >
          {saving === "next" ? "Saving…" : "Save and next"}
        </Button>
        <p className="w-full text-sm text-zinc-400">
          Save pick writes this call now. Save and next jumps to the next blank game. You can still change it until
          the lock.
        </p>
        {saveError ? <p className="w-full text-sm text-red-300">{saveError}</p> : null}
        <ButtonLink href={weekListHref(weekId, game.id)} variant="ghost" className="h-12 min-h-12 w-full md:w-auto">
          Cancel
        </ButtonLink>
      </div>
    </div>
  );
}
