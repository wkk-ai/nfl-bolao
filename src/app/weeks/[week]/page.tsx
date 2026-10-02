"use client";

import { use } from "react";
import { GameCard } from "@/components/game-card";
import { ButtonLink } from "@/components/button-link";
import { ReactionBar } from "@/components/reaction-bar";
import { EmptyState, ErrorState, PageLoading } from "@/components/states";
import { useStore } from "@/lib/store";
import { unpickedOpenGames, weekGames, weekPoints, weeklyAwards } from "@/lib/compute";
import { deriveWeekState, weekStateLabel } from "@/lib/week-state";

export default function WeekMatchupsPage({ params }: { params: Promise<{ week: string }> }) {
  const { week: weekParam } = use(params);
  const weekId = Number(weekParam);
  const { ready, weeks, picks, activePlayer } = useStore();
  if (!ready) return <PageLoading />;
  const week = weeks.find((w) => w.id === weekId);
  if (!week) return <ErrorState title="Week not found" body="That week is not on the 2026 slate we loaded." />;
  const games = weekGames(week, picks);
  const missing = unpickedOpenGames(week, picks, activePlayer);
  const pts = weekPoints(week, picks, activePlayer);
  const awards = weeklyAwards(week, picks);
  const state = deriveWeekState(week);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium text-zinc-500">{weekStateLabel(state)}</p>
          <h1 className="text-2xl font-medium text-amber-200 sm:text-3xl">{week.label} matchups</h1>
          <p className="text-zinc-400">
            Pick the winner, then how far they win. Lock hits at kickoff, not at your bedtime.
          </p>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
          <ButtonLink href={`/weeks/${weekId}/review`} variant="secondary" className="w-full sm:w-auto">
            Review card
          </ButtonLink>
          <ButtonLink href={`/weeks/${weekId}/results`} variant="outline" className="w-full sm:w-auto">
            Reveal
          </ButtonLink>
        </div>
      </div>
      {missing.length > 0 ? (
        <p className="rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-sm">
          {missing.length} still blank. Start with any open game.
        </p>
      ) : state === "final" || state === "locked" ? (
        <EmptyState
          title={pts.total === 0 ? "No card this week" : "Nothing left open"}
          body={
            pts.total === 0
              ? "This week was missed. Real scores are on the reveal. The 100-point start does not move."
              : "Lock already hit. Review the reveal for the receipts."
          }
        />
      ) : (
        <EmptyState title="Nothing left open" body="Either lock already hit, or your card is full. Review it before you walk away." />
      )}
      {state === "final" ? (
        <p className="text-sm text-zinc-300">
          Your week: {pts.total} pts{pts.bonus ? ` (includes +${pts.bonus} perfect-week bonus)` : ""}.
        </p>
      ) : null}
      {awards.length > 0 ? (
        <div className="grid gap-2 md:grid-cols-2">
          {awards.map((a) => (
            <div key={a.id} className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm">
              <div className="text-amber-200">{a.title}</div>
              <div className="text-zinc-400">{a.detail}</div>
            </div>
          ))}
        </div>
      ) : null}
      <div className="grid gap-3">
        {games.map((g) => (
          <GameCard key={g.id} game={g} weekId={weekId} playerId={activePlayer} />
        ))}
      </div>
      <ReactionBar weekId={weekId} from={activePlayer} />
    </div>
  );
}
