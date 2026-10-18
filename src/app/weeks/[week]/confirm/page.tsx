"use client";

import { use } from "react";
import { ButtonLink } from "@/components/button-link";
import { Card } from "@/components/ui/card";
import { ErrorState, PageLoading } from "@/components/states";
import { useStore } from "@/lib/store";
import { weekGames } from "@/lib/compute";
import { bucketRange } from "@/lib/scoring";

export default function ConfirmPage({ params }: { params: Promise<{ week: string }> }) {
  const { week: weekParam } = use(params);
  const weekId = Number(weekParam);
  const { ready, weeks, picks, activePlayer } = useStore();
  if (!ready) return <PageLoading />;
  const week = weeks.find((w) => w.id === weekId);
  if (!week) return <ErrorState title="Week not found" body="Confirmation has nowhere to land." />;
  const games = weekGames(week, picks, activePlayer);
  const yours = games.filter((g) => {
    const p = activePlayer === "will" ? g.willPick : g.saraPick;
    return p && !p.draft;
  });
  const name = activePlayer === "will" ? "Will" : "Sara";

  return (
    <div className="space-y-5">
      <p className="text-xs font-medium text-emerald-400">Submitted</p>
      <h1 className="text-2xl font-medium text-amber-200 sm:text-3xl">{name}, the card is in.</h1>
      <p className="text-zinc-300">
        {yours.length} submitted pick{yours.length === 1 ? "" : "s"} on {week.label}. Drafts do not count. Open games can
        still be edited until kickoff.
      </p>
      <Card className="border-white/10 bg-black/40 p-4 text-sm">
        <ul className="space-y-2">
          {yours.map((g) => {
            const p = activePlayer === "will" ? g.willPick : g.saraPick;
            return (
              <li key={g.id}>
                {g.awayAbbr} @ {g.homeAbbr} — {p?.winnerAbbr} to {bucketRange(p!.marginBucket)}
              </li>
            );
          })}
        </ul>
      </Card>
      <div className="flex flex-wrap gap-2">
        <ButtonLink href={`/weeks/${weekId}`}>Back to matchups</ButtonLink>
        <ButtonLink href="/leaderboard" variant="secondary">
          Season board
        </ButtonLink>
      </div>
    </div>
  );
}
