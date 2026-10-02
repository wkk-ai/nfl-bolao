"use client";

import { use, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TeamLogo } from "@/components/team-logo";
import { ButtonLink } from "@/components/button-link";
import { ErrorState, PageLoading } from "@/components/states";
import { useStore } from "@/lib/store";
import { bucketCopy, bucketRange, MARGIN_BUCKETS } from "@/lib/scoring";
import { gameLocked } from "@/lib/week-state";
import { formatKickoff } from "@/lib/format";
import { draftOrPick } from "@/lib/compute";
import type { MarginBucket } from "@/lib/types";
import { cn } from "@/lib/utils";
import { teamMeta } from "@/lib/teams";

export default function PickPage({
  params,
}: {
  params: Promise<{ week: string; gameId: string }>;
}) {
  const { week: weekParam, gameId } = use(params);
  const weekId = Number(weekParam);
  const router = useRouter();
  const { ready, weeks, picks, activePlayer, saveDraft } = useStore();
  const week = weeks.find((w) => w.id === weekId);
  const game = week?.games.find((g) => g.id === gameId);
  const existing = game ? draftOrPick(picks, activePlayer, game.id) : undefined;
  const [winner, setWinner] = useState<string | undefined>(existing?.winnerAbbr);
  const [bucket, setBucket] = useState<MarginBucket | undefined>(existing?.marginBucket);

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
        <h1 className="font-heading text-3xl text-amber-200">This one’s locked</h1>
        <p className="text-zinc-400">
          Kickoff was {formatKickoff(game.kickoff)}. You cannot change a pick after the ball is in the air.
        </p>
        <ButtonLink href={`/weeks/${weekId}`}>Back to matchups</ButtonLink>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
          Step {step} of 2 · locks {formatKickoff(game.kickoff)}
        </p>
        <h1 className="font-heading text-4xl text-amber-200">Make the call</h1>
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
                "rounded-xl border p-4 text-left transition",
                on ? "border-amber-300 bg-amber-300/10" : "border-white/10 bg-black/40",
              )}
              style={{ boxShadow: on ? `inset 0 0 0 1px ${meta.primary}` : undefined }}
            >
              <div className="flex items-center gap-3">
                <TeamLogo abbr={t.abbr} size={48} />
                <div>
                  <div className="text-xs text-zinc-500">{t.side}</div>
                  <div className="font-heading text-2xl">{t.abbr}</div>
                  <div className="text-sm text-zinc-400">{t.name}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      {winner ? (
        <div className="space-y-3">
          <h2 className="font-heading text-2xl">Winning margin</h2>
          <p className="text-sm text-zinc-400">
            These are buckets, not exact scores. 5 = {bucketRange(5)}. 10 = {bucketRange(10)}. 15 ={" "}
            {bucketRange(15)}. 20 = {bucketRange(20)}.
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            {MARGIN_BUCKETS.map((b) => {
              const copy = bucketCopy(b);
              const on = bucket === b;
              return (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBucket(b)}
                  className={cn(
                    "rounded-xl border p-4 text-left",
                    on ? "border-amber-300 bg-amber-300/10" : "border-white/10 bg-black/40",
                    b === 20 && "ring-1 ring-red-400/30",
                  )}
                >
                  <div className="font-heading text-3xl">{b}</div>
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
      <div className="flex gap-2">
        <Button
          disabled={!winner || !bucket}
          className="bg-amber-400 text-black hover:bg-amber-300"
          onClick={() => {
            if (!winner || !bucket) return;
            saveDraft(game.id, weekId, winner, bucket);
            router.push(`/weeks/${weekId}/review`);
          }}
        >
          Save to card
        </Button>
        <ButtonLink href={`/weeks/${weekId}`} variant="ghost">
          Cancel
        </ButtonLink>
      </div>
    </div>
  );
}
