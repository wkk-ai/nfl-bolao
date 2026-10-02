"use client";

import { use } from "react";
import { Card } from "@/components/ui/card";
import { TeamLogo } from "@/components/team-logo";
import { ButtonLink } from "@/components/button-link";
import { ErrorState, EmptyState, PageLoading } from "@/components/states";
import { ReactionBar } from "@/components/reaction-bar";
import { useStore } from "@/lib/store";
import { pickFor, weekPoints, weeklyAwards } from "@/lib/compute";
import { bucketRange, scorePick } from "@/lib/scoring";
import { cn } from "@/lib/utils";

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
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-4xl text-amber-200">{week.label} reveal</h1>
        <EmptyState
          title="No finals yet"
          body="Thursday’s game is in. The rest of this week is still upcoming. Come back after kickoffs."
        />
        <ButtonLink href={`/weeks/${weekId}`}>Matchups</ButtonLink>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Weekly reveal</p>
        <h1 className="font-heading text-4xl text-amber-200">{week.label} is on the board</h1>
        <p className="text-zinc-300">
          Will {will.total} pts · Sara {sara.total} pts
          {will.bonus || sara.bonus ? " · perfect-week bonus is in the total" : ""}
        </p>
      </div>
      {will.bonus || sara.bonus ? (
        <Card className="border-amber-300/40 bg-amber-300/10 p-4 text-center">
          <p className="font-heading text-3xl text-amber-200">Perfect week</p>
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
            <Card key={game.id} className="border-white/10 bg-black/40 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TeamLogo abbr={game.awayAbbr} size={32} />
                  <span className="text-zinc-500">@</span>
                  <TeamLogo abbr={game.homeAbbr} size={32} />
                </div>
                <div className="text-right text-sm">
                  {game.status === "final" ? (
                    <>
                      <div className="font-semibold">
                        {game.awayScore}–{game.homeScore}
                      </div>
                      <div className="text-zinc-400">
                        {game.winner} by {game.margin} · {actual ? bucketRange(actual) : "tie"}
                      </div>
                    </>
                  ) : (
                    <div className="text-zinc-500">Not final</div>
                  )}
                </div>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {(["will", "sara"] as const).map((pid) => {
                  const pick = pickFor(picks, pid, game.id);
                  const scored = scorePick(pick, game);
                  const ok = scored?.correctWinner;
                  return (
                    <div
                      key={pid}
                      className={cn(
                        "rounded-lg px-3 py-2 text-sm transition",
                        game.status !== "final"
                          ? "bg-white/5"
                          : ok
                            ? "bg-emerald-500/15 text-emerald-100"
                            : "bg-red-500/15 text-red-100",
                      )}
                    >
                      <div className="font-medium">{pid === "will" ? "Will" : "Sara"}</div>
                      {pick ? (
                        <div>
                          {pick.winnerAbbr} · {bucketRange(pick.marginBucket)}
                          {scored ? ` · ${scored.total} pts` : ""}
                          {scored?.exactBucket ? " · exact bucket" : ""}
                          {scored && scored.bucketOff === 1 ? " · one bucket off" : ""}
                        </div>
                      ) : (
                        <div>No pick</div>
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
