"use client";

import { ButtonLink } from "@/components/button-link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GapMeter } from "@/components/gap-meter";
import { SeasonChart } from "@/components/season-chart";
import { EmptyState, PageLoading } from "@/components/states";
import { useStore } from "@/lib/store";
import {
  currentWeek,
  ranked,
  seasonTotals,
  unpickedOpenGames,
  winnerStreak,
} from "@/lib/compute";
import { deriveWeekState, weekStateLabel } from "@/lib/week-state";

export default function HomePage() {
  const { ready, weeks, picks, activePlayer, demo } = useStore();
  if (!ready) return <PageLoading label="Warming up the 2026 slate…" />;
  const week = currentWeek(weeks);
  const ranks = ranked(weeks, picks);
  const you = ranks.find((r) => r.playerId === activePlayer)!;
  const other = ranks.find((r) => r.playerId !== activePlayer)!;
  const missing = unpickedOpenGames(week, picks, activePlayer);
  const streak = winnerStreak(weeks, picks, activePlayer);
  const totals = seasonTotals(weeks, picks);
  const state = deriveWeekState(week);

  return (
    <div className="space-y-6">
      {demo ? (
        <p className="rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-sm text-amber-100">
          Demo data on this device. 2026 ESPN week slate is loaded. Picks stay in the browser until Supabase keys are set.
        </p>
      ) : null}

      <section className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Will vs Sara · 2026 regular season</p>
        <h1 className="font-heading text-4xl text-amber-200 md:text-5xl">The bolão is live.</h1>
        <p className="max-w-2xl text-zinc-300">
          {you.name} sits at {you.pts} pts
          {you.tied ? ", tied with " : you.rank === 1 ? ", leading " : ", chasing "}
          {other.name} at {other.pts}. Week {week.id} is {weekStateLabel(state).toLowerCase()}.
        </p>
      </section>

      {missing.length > 0 ? (
        <Card className="border-amber-400/30 bg-amber-400/10 p-4">
          <p className="font-medium text-amber-100">
            {missing.length} game{missing.length === 1 ? "" : "s"} still unpicked this week.
          </p>
          <p className="mt-1 text-sm text-amber-100/80">Kickoff lock is real. Miss it and it’s a zero.</p>
          <ButtonLink href={`/weeks/${week.id}`} className="mt-3 bg-amber-400 text-black hover:bg-amber-300">
            Pick Week {week.id}
          </ButtonLink>
        </Card>
      ) : (
        <EmptyState
          title="Card is in."
          body={`No open games left to fill as ${you.name}. Check the board or needle the other chair.`}
        />
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-white/10 bg-black/40 p-4">
          <p className="text-xs text-zinc-500">Your season</p>
          <p className="font-heading text-3xl text-amber-200">{totals[activePlayer].total}</p>
          <p className="text-sm text-zinc-400">{you.tied ? "Tied for first" : `Rank ${you.rank}`}</p>
        </Card>
        <Card className="border-white/10 bg-black/40 p-4">
          <p className="text-xs text-zinc-500">Winner streak</p>
          <p className="font-heading text-3xl">{streak}</p>
          <p className="text-sm text-zinc-400">Correct winners in a row</p>
        </Card>
        <Card className="border-white/10 bg-black/40 p-4">
          <p className="text-xs text-zinc-500">This week</p>
          <p className="font-heading text-3xl">W{week.id}</p>
          <Badge className="mt-1 bg-white/10">{weekStateLabel(state)}</Badge>
        </Card>
      </div>

      <GapMeter ranks={ranks} />
      <SeasonChart weeks={weeks} picks={picks} />

      <div className="flex flex-wrap gap-2">
        <ButtonLink href={`/weeks/${week.id}/results`} variant="secondary">
          Week {week.id} reveal
        </ButtonLink>
        <ButtonLink href="/leaderboard" variant="secondary">
          Full board
        </ButtonLink>
        <ButtonLink href={`/players/${activePlayer}`} variant="secondary">
          {you.name}’s page
        </ButtonLink>
      </div>
    </div>
  );
}
