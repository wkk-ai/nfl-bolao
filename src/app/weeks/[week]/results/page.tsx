"use client";

import { use } from "react";
import { Card } from "@/components/ui/card";
import { TeamLogo } from "@/components/team-logo";
import { ButtonLink } from "@/components/button-link";
import { ErrorState, EmptyState, PageLoading } from "@/components/states";
import { ReactionBar } from "@/components/reaction-bar";
import { useStore } from "@/lib/store";
import { pickFor, weekHasStarted, weekPoints, weeklyAwards } from "@/lib/compute";
import { bucketRange, scorePick } from "@/lib/scoring";
import { canEditPick, revealReady } from "@/lib/reveal";
import { gameLocked } from "@/lib/week-state";
import { formatLockedAt } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";

export default function ResultsPage({ params }: { params: Promise<{ week: string }> }) {
  const { week: weekParam } = use(params);
  const weekId = Number(weekParam);
  const { ready, weeks, picks, activePlayer } = useStore();
  if (!ready) return <PageLoading />;
  const week = weeks.find((w) => w.id === weekId);
  if (!week) return <ErrorState title="Week not found" body="No reveal for a missing week." />;
  const revealed = week.games.filter((g) => g.status === "final");
  const will = weekPoints(week, picks, "will");
  const sara = weekPoints(week, picks, "sara");
  const awards = weeklyAwards(week, picks);
  const started = weekHasStarted(week);

  if (!started) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-medium text-amber-200 sm:text-3xl">{week.label} reveal</h1>
        <EmptyState title="This week has not started" body="Nothing has kicked off in this week yet." />
        <ButtonLink href={`/weeks/${weekId}`}>Matchups</ButtonLink>
        <div className="h-24 md:hidden" aria-hidden />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-medium text-zinc-500">Weekly reveal</p>
        <h1 className="text-2xl font-medium text-amber-200 sm:text-3xl">{week.label} is on the board</h1>
        <p className="text-zinc-300">
          {revealed.length === 0
            ? "Scores stay hidden until Will and Sara have both picked. Points are added only then."
            : will.total === 0 && sara.total === 0
              ? "Neither Will nor Sara had a pick. The 100-point start does not move."
              : `Will ${will.total} pts · Sara ${sara.total} pts${will.bonus || sara.bonus ? " · perfect-week bonus is in the total" : ""}`}
        </p>
      </div>
      {will.bonus || sara.bonus ? (
        <Card className="border-amber-300/40 bg-amber-300/10 p-4 text-center">
          <p className="text-2xl font-medium text-amber-200">Perfect week</p>
          <p className="text-zinc-200">
            {will.bonus ? "Will hit every winner. " : ""}
            {sara.bonus ? "Sara hit every winner." : ""}
          </p>
        </Card>
      ) : null}
      {awards.map((a) => (
        <p key={a.id} className="text-sm text-zinc-300">
          <span className="text-amber-200">{a.title}:</span> {a.detail}
        </p>
      ))}
      <div className="space-y-3">
        {week.games.map((game) => {
          const actual = game.marginBucket;
          const scoreShown = game.homeScore != null && game.awayScore != null;
          const hiddenScore = !scoreShown && !game.scoresPublic && gameLocked(game);
          const youCanAdd = canEditPick(game, picks, activePlayer) && !pickFor(picks, activePlayer, game.id);
          return (
            <Card
              key={game.id}
              className={cn(
                "border-white/10 bg-black/40 p-4",
                game.status !== "final" && gameLocked(game) && "opacity-70",
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TeamLogo abbr={game.awayAbbr} size={32} />
                  <span className="text-zinc-500">@</span>
                  <TeamLogo abbr={game.homeAbbr} size={32} />
                </div>
                <div className="text-right text-sm">
                  {scoreShown ? (
                    <>
                      <div className="font-medium">
                        {game.awayScore}–{game.homeScore}
                      </div>
                      <div className="text-zinc-400">
                        {game.status === "final"
                          ? game.winner
                            ? `${game.winner} by ${game.margin}${actual ? ` · ${bucketRange(actual)}` : ""}`
                            : "Tie"
                          : "In progress"}
                      </div>
                    </>
                  ) : hiddenScore ? (
                    <div className="text-zinc-300">Score hidden until you both pick</div>
                  ) : gameLocked(game) ? (
                    <div className="text-amber-100">
                      <span className="inline-flex items-center gap-1">
                        <Lock className="size-3.5" aria-hidden />
                        Locked
                      </span>
                      <div className="text-xs text-zinc-400">{formatLockedAt(game.kickoff)}</div>
                    </div>
                  ) : (
                    <div className="text-zinc-500">Not final</div>
                  )}
                </div>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {(["will", "sara"] as const).map((pid) => {
                  const hide =
                    pid !== activePlayer &&
                    (!gameLocked(game) || (!game.scoresPublic && !revealReady(picks, game.id)));
                  const pick = hide ? undefined : pickFor(picks, pid, game.id);
                  const scored = hide || !scoreShown || game.status !== "final" ? null : scorePick(pick, game);
                  const ok = scored?.correctWinner;
                  return (
                    <div
                      key={pid}
                      className={cn(
                        "rounded-lg px-3 py-2 text-sm transition",
                        game.status !== "final"
                          ? "bg-white/5"
                          : hide || !pick
                            ? "bg-white/5 text-zinc-400"
                          : ok
                            ? "bg-emerald-500/15 text-emerald-100"
                            : "bg-red-500/15 text-red-100",
                      )}
                    >
                      <div className="font-medium">{pid === "will" ? "Will" : "Sara"}</div>
                      {hide ? (
                        <div>{game.scoresPublic ? "Hidden until kickoff" : "Hidden until you both pick"}</div>
                      ) : pick ? (
                        <div>
                          {pick.winnerAbbr} · {bucketRange(pick.marginBucket)}
                          {scored ? ` · ${scored.total} pts` : ""}
                          {scored?.exactBucket ? " · exact bucket" : ""}
                          {scored && scored.bucketOff === 1 ? " · one bucket off" : ""}
                          {game.status === "final" && !game.winner ? " · tie, 0 pts" : ""}
                        </div>
                      ) : (
                        youCanAdd && pid === activePlayer ? (
                          <ButtonLink href={`/weeks/${weekId}/pick/${game.id}`} size="sm" className="mt-2">
                            Add your pick
                          </ButtonLink>
                        ) : (
                          <div>{game.status === "final" ? "Left it blank" : "No pick yet"}</div>
                        )
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
      <ReactionBar weekId={weekId} from={activePlayer} />
      <div className="h-24 md:hidden" aria-hidden />
    </div>
  );
}
