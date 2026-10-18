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
  const finals = week.games.filter((g) => g.status === "final");
  const will = weekPoints(week, picks, "will");
  const sara = weekPoints(week, picks, "sara");
  const awards = weeklyAwards(week, picks);

  if (finals.length === 0) {
    const started = weekHasStarted(week);
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-medium text-amber-200 sm:text-3xl">{week.label} reveal</h1>
        <EmptyState
          title={started ? "Scores are not in yet" : "This week has not started"}
          body={
            started
              ? "Games have kicked off. Come back when the scoreboard posts a final."
              : "Nothing has kicked off in this week yet."
          }
        />
        <ButtonLink href={`/weeks/${weekId}`}>Matchups</ButtonLink>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-medium text-zinc-500">Weekly reveal</p>
        <h1 className="text-2xl font-medium text-amber-200 sm:text-3xl">{week.label} is on the board</h1>
        <p className="text-zinc-300">
          {will.total === 0 && sara.total === 0
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
                  {game.status === "final" ? (
                    <>
                      <div className="font-medium">
                        {game.awayScore}–{game.homeScore}
                      </div>
                      <div className="text-zinc-400">
                        {game.winner
                          ? `${game.winner} by ${game.margin}${actual ? ` · ${bucketRange(actual)}` : ""}`
                          : "Tie"}
                      </div>
                    </>
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
                  const hide = pid !== activePlayer && !gameLocked(game);
                  const pick = hide ? undefined : pickFor(picks, pid, game.id);
                  const scored = hide ? null : scorePick(pick, game);
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
                        <div>Hidden until kickoff</div>
                      ) : pick ? (
                        <div>
                          {pick.winnerAbbr} · {bucketRange(pick.marginBucket)}
                          {scored ? ` · ${scored.total} pts` : ""}
                          {scored?.exactBucket ? " · exact bucket" : ""}
                          {scored && scored.bucketOff === 1 ? " · one bucket off" : ""}
                          {game.status === "final" && !game.winner ? " · tie, 0 pts" : ""}
                        </div>
                      ) : (
                        <div>{game.status === "final" ? "Left it blank" : "No pick yet"}</div>
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
    </div>
  );
}
