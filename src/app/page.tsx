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
          Both chairs started at 100 after missing the early weeks. Those games don’t move the score. New picks stack on 100. Until a Supabase project is wired, cards stay on this device.
        </p>
      ) : null}

      <section className="space-y-2">
        <p className="text-xs font-medium text-zinc-500">Will vs Sara · 2026 regular season · ESPN slate</p>
        <h1 className="text-2xl font-medium text-amber-200 sm:text-3xl">The bolão is live.</h1>
        <p className="max-w-2xl text-zinc-300">
          {you.name} sits at {you.pts} pts
          {you.tied ? ", tied with " : you.rank === 1 ? ", leading " : ", chasing "}
          {other.name} at {other.pts}. Week {week.id} is {weekStateLabel(state).toLowerCase()}.
          {you.tied && you.pts === 100 ? " Missed weeks stay at 100." : ""}
        </p>
      </section>

      {missing.length > 0 ? (
        <Card className="border-amber-400/30 bg-amber-400/10 p-4">
          <p className="font-medium text-amber-100">
            {missing.length} game{missing.length === 1 ? "" : "s"} still unpicked this week.
          </p>
          <p className="mt-1 text-sm text-amber-100/80">Kickoff lock is real. Miss it and it’s a zero.</p>
          <ButtonLink href={`/weeks/${week.id}`} className="mt-3 w-full bg-amber-400 text-black hover:bg-amber-300 sm:w-auto">
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
          <p className="text-2xl font-medium text-amber-200">{totals[activePlayer].total}</p>
          <p className="text-sm text-zinc-400">{you.tied ? "Tied for first" : `Rank ${you.rank}`}</p>
        </Card>
        <Card className="border-white/10 bg-black/40 p-4">
          <p className="text-xs text-zinc-500">Winner streak</p>
          <p className="text-2xl font-medium">{streak}</p>
          <p className="text-sm text-zinc-400">Correct winners in a row</p>
        </Card>
        <Card className="border-white/10 bg-black/40 p-4">
          <p className="text-xs text-zinc-500">This week</p>
          <p className="text-2xl font-medium">W{week.id}</p>
          <Badge className="mt-1 bg-white/10">{weekStateLabel(state)}</Badge>
        </Card>
      </div>

      <GapMeter ranks={ranks} />
      <SeasonChart weeks={weeks} picks={picks} />

      <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
        <ButtonLink href={`/weeks/${week.id}/results`} variant="secondary" className="w-full sm:w-auto">
          Week {week.id} reveal
        </ButtonLink>
        <ButtonLink href="/leaderboard" variant="secondary" className="w-full sm:w-auto">
          Full board
        </ButtonLink>
        <ButtonLink href={`/players/${activePlayer}`} variant="secondary" className="w-full sm:w-auto">
          {you.name}’s page
        </ButtonLink>
      </div>
    </div>
  );
}
