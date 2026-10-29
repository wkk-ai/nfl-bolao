"use client";

import { use } from "react";
import { Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { TeamLogo } from "@/components/team-logo";
import { ButtonLink } from "@/components/button-link";
import { ErrorState, EmptyState, PageLoading } from "@/components/states";
import { useStore } from "@/lib/store";
import { gameAnchorId, pickFor } from "@/lib/compute";
import { useScrollToGame } from "@/lib/focus-game";
import { bucketRange } from "@/lib/scoring";
import { canEditPick } from "@/lib/reveal";
import { gameLocked } from "@/lib/week-state";
import { formatLockedAt } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function ReviewPage({ params }: { params: Promise<{ week: string }> }) {
  const { week: weekParam } = use(params);
  const weekId = Number(weekParam);
  const { ready, weeks, picks, activePlayer } = useStore();
  const focusId = useScrollToGame(ready);
  if (!ready) return <PageLoading />;
  const week = weeks.find((w) => w.id === weekId);
  if (!week) return <ErrorState title="Week not found" body="Cannot open a week that does not exist." />;

  const name = activePlayer === "will" ? "Will" : "Sara";
  const rows = week.games.map((g) => ({
    game: g,
    pick: pickFor(picks, activePlayer, g.id),
    locked: gameLocked(g) && !canEditPick(g, picks, activePlayer),
  }));
  const openMissing = rows.filter((r) => !r.locked && !r.pick);
  const saved = rows.filter((r) => r.pick).length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-medium text-amber-200 sm:text-3xl">My card · {week.label}</h1>
        <p className="text-zinc-400">
          {name} has {saved} saved pick{saved === 1 ? "" : "s"} this week. Every save already counts. You can change a
          pick until kickoff. If kickoff has passed and you have not picked, you can still add one.
        </p>
      </div>
      {openMissing.length > 0 ? (
        <p className="rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-sm">
          {openMissing.length} still empty. The score stays hidden until you both pick.
        </p>
      ) : (
        <EmptyState title="Card looks full" body="Kickoff still owns the lock. Change an open pick from the matchup if you need to." />
      )}
      <div className="space-y-2">
        {rows.map(({ game, pick, locked }) => (
          <Card
            key={game.id}
            id={gameAnchorId(game.id)}
            className={cn(
              "scroll-mt-40 scroll-mb-28 flex flex-col gap-3 border-white/10 bg-black/40 p-3 sm:flex-row sm:items-center",
              focusId === game.id && "ring-2 ring-amber-300/80",
              locked && "opacity-70",
            )}
          >
            <div className="flex min-w-0 items-center gap-3">
              <TeamLogo abbr={game.awayAbbr} size={32} />
              <span className="text-xs text-zinc-500">@</span>
              <TeamLogo abbr={game.homeAbbr} size={32} />
              <div className="min-w-0 flex-1 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span>
                    {game.awayAbbr} at {game.homeAbbr}
                  </span>
                  {locked ? (
                    <span className="inline-flex items-center gap-1 rounded-md border border-amber-400/40 bg-amber-400/15 px-2 py-0.5 text-xs text-amber-100">
                      <Lock className="size-3.5" aria-hidden />
                      Locked
                    </span>
                  ) : null}
                </div>
                <div className="text-zinc-400">
                  {locked ? <div>{formatLockedAt(game.kickoff)}</div> : null}
                  {pick
                    ? `${pick.winnerAbbr} · ${bucketRange(pick.marginBucket)}`
                    : locked
                      ? "Missed"
                      : "No pick yet"}
                </div>
              </div>
            </div>
            {!locked ? (
              <ButtonLink
                href={`/weeks/${weekId}/pick/${game.id}`}
                size="sm"
                variant="outline"
                className="w-full sm:ml-auto sm:w-auto"
              >
                {pick ? "Change" : "Pick"}
              </ButtonLink>
            ) : null}
          </Card>
        ))}
      </div>
      <div className="h-24 md:hidden" aria-hidden />
    </div>
  );
}
