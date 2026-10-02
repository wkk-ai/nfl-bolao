"use client";

import { use } from "react";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/button-link";
import { ErrorState, PageLoading } from "@/components/states";
import { useStore } from "@/lib/store";
import { badgesFor, ranked, seasonTotals, weekPoints, winnerStreak } from "@/lib/compute";
import type { PlayerId } from "@/lib/types";

export default function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const playerId = id as PlayerId;
  const { ready, weeks, picks, reactions } = useStore();
  if (!ready) return <PageLoading />;
  if (playerId !== "will" && playerId !== "sara") {
    return <ErrorState title="Unknown player" body="This bolão only has Will and Sara." />;
  }
  const name = playerId === "will" ? "Will" : "Sara";
  const ranks = ranked(weeks, picks);
  const you = ranks.find((r) => r.playerId === playerId)!;
  const totals = seasonTotals(weeks, picks)[playerId];
  const badges = badgesFor(weeks, picks, reactions, playerId);
  const streak = winnerStreak(weeks, picks, playerId);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-medium text-zinc-500">Player</p>
        <h1 className="text-2xl font-medium text-amber-200 sm:text-3xl">{name}</h1>
        <p className="text-zinc-300">
          {you.pts} season pts · {you.tied ? "tied for first" : `rank ${you.rank}`} · winner streak {streak}
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {weeks.map((w, i) => {
          const wp = weekPoints(w, picks, playerId);
          return (
            <Card key={w.id} className="border-white/10 bg-black/40 p-4">
              <div className="flex items-center justify-between">
                <div className="text-lg font-medium">{w.label}</div>
                <div className="text-amber-200">{wp.total} pts</div>
              </div>
              <p className="text-xs text-zinc-500">Running total {totals.byWeek.slice(0, i + 1).reduce((a, b) => a + b.pts, 0)}</p>
              <ButtonLink href={`/weeks/${w.id}/results`} size="sm" variant="ghost" className="mt-2">
                Reveal
              </ButtonLink>
            </Card>
          );
        })}
      </div>
      <div>
        <h2 className="text-xl font-medium text-amber-200">Badges</h2>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {badges.map((b) => (
            <Card
              key={b.id}
              className={`border-white/10 p-3 ${b.earned ? "bg-amber-400/10" : "bg-black/30 opacity-60"}`}
            >
              <div className="font-medium">{b.title}</div>
              <div className="text-sm text-zinc-400">{b.detail}</div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
