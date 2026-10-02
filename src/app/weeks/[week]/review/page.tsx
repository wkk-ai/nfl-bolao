"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TeamLogo } from "@/components/team-logo";
import { ButtonLink } from "@/components/button-link";
import { ErrorState, EmptyState, PageLoading } from "@/components/states";
import { useStore } from "@/lib/store";
import { draftOrPick } from "@/lib/compute";
import { bucketRange } from "@/lib/scoring";
import { gameLocked } from "@/lib/week-state";
import { toast } from "sonner";

export default function ReviewPage({ params }: { params: Promise<{ week: string }> }) {
  const { week: weekParam } = use(params);
  const weekId = Number(weekParam);
  const router = useRouter();
  const { ready, weeks, picks, activePlayer, submitWeek } = useStore();
  if (!ready) return <PageLoading />;
  const week = weeks.find((w) => w.id === weekId);
  if (!week) return <ErrorState title="Week not found" body="Cannot review a week that does not exist." />;

  const rows = week.games.map((g) => ({
    game: g,
    pick: draftOrPick(picks, activePlayer, g.id),
    locked: gameLocked(g),
  }));
  const openMissing = rows.filter((r) => !r.locked && !r.pick);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-medium text-amber-200 sm:text-3xl">Review {week.label}</h1>
        <p className="text-zinc-400">
          Check every line before you lock it in. Drafts stay drafts until you submit.
        </p>
      </div>
      {openMissing.length > 0 ? (
        <p className="rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-sm">
          {openMissing.length} still empty. You can submit the rest and come back, but a blank after kickoff is a zero.
        </p>
      ) : (
        <EmptyState title="Card looks full" body="Hit submit to stamp these picks. After kickoff they will not move." />
      )}
      <div className="space-y-2">
        {rows.map(({ game, pick, locked }) => (
          <Card key={game.id} className="flex flex-col gap-3 border-white/10 bg-black/40 p-3 sm:flex-row sm:items-center">
            <div className="flex min-w-0 items-center gap-3">
              <TeamLogo abbr={game.awayAbbr} size={32} />
              <span className="text-xs text-zinc-500">@</span>
              <TeamLogo abbr={game.homeAbbr} size={32} />
              <div className="min-w-0 flex-1 text-sm">
                <div>
                  {game.awayAbbr} at {game.homeAbbr}
                </div>
                <div className="text-zinc-400">
                  {pick
                    ? `${pick.winnerAbbr} · ${bucketRange(pick.marginBucket)}${pick.draft ? " · draft" : " · in"}`
                    : locked
                      ? "Missed — locked with no pick"
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
                Edit
              </ButtonLink>
            ) : null}
          </Card>
        ))}
      </div>
      <Button
        className="h-12 min-h-12 w-full bg-amber-400 text-black hover:bg-amber-300 sm:w-auto"

        onClick={() => {
          submitWeek(weekId);
          toast.success("Card submitted. Kickoff still owns the lock.");
          router.push(`/weeks/${weekId}/confirm`);
        }}
      >
        Submit {activePlayer === "will" ? "Will" : "Sara"}’s card
      </Button>
    </div>
  );
}
