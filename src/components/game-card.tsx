"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TeamLogo } from "@/components/team-logo";
import { formatKickoffShort } from "@/lib/format";
import { bucketRange } from "@/lib/scoring";
import { teamMeta } from "@/lib/teams";
import type { GameView } from "@/lib/compute";
import type { PlayerId } from "@/lib/types";
import { cn } from "@/lib/utils";

export function GameCard({
  game,
  weekId,
  playerId,
}: {
  game: GameView;
  weekId: number;
  playerId: PlayerId;
}) {
  const pick = playerId === "will" ? game.willPick : game.saraPick;
  const other = playerId === "will" ? game.saraPick : game.willPick;
  const home = teamMeta(game.homeAbbr);
  return (
    <Card
      className="overflow-hidden border-white/10 bg-black/40"
      style={{ borderLeft: `4px solid ${home.primary}` }}
    >
      <Link
        href={game.locked ? `/weeks/${weekId}/results` : `/weeks/${weekId}/pick/${game.id}`}
        className="block min-h-14 p-4 touch-manipulation"
      >
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span>{formatKickoffShort(game.kickoff)}</span>
          <Badge variant="secondary" className="bg-white/5 text-zinc-300">
            {game.status === "final" ? "Final" : game.locked ? "Locked" : "Open"}
          </Badge>
        </div>
        <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <TeamLogo abbr={game.awayAbbr} className="shrink-0" />
            <div className="min-w-0">
              <div className="font-medium">{game.awayAbbr}</div>
              <div className="truncate text-xs text-zinc-500">{game.awayName}</div>
            </div>
          </div>
          <div className="px-1 text-center text-lg font-medium tabular-nums">
            {game.status === "final" ? (
              <span>
                {game.awayScore}–{game.homeScore}
              </span>
            ) : (
              <span className="text-zinc-500">@</span>
            )}
          </div>
          <div className="flex min-w-0 items-center justify-end gap-2 text-right">
            <div className="min-w-0">
              <div className="font-medium">{game.homeAbbr}</div>
              <div className="truncate text-xs text-zinc-500">{game.homeName}</div>
            </div>
            <TeamLogo abbr={game.homeAbbr} className="shrink-0" />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className={cn("rounded-md px-2 py-1", pick ? "bg-amber-400/15 text-amber-200" : "bg-white/5 text-zinc-500")}>
            You: {pick ? `${pick.winnerAbbr} · ${bucketRange(pick.marginBucket)}` : "no pick"}
            {pick?.draft ? " (draft)" : ""}
          </span>
          <span className="rounded-md bg-white/5 px-2 py-1 text-zinc-400">
            {playerId === "will" ? "Sara" : "Will"}:{" "}
            {other ? `${other.winnerAbbr} · ${bucketRange(other.marginBucket)}` : "still out"}
          </span>
        </div>
      </Link>
    </Card>
  );
}
