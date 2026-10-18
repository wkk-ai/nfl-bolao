"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TeamLogo } from "@/components/team-logo";
import { formatKickoffShort, formatLockedAt } from "@/lib/format";
import { bucketRange } from "@/lib/scoring";
import { teamMeta } from "@/lib/teams";
import { gameAnchorId, type GameView } from "@/lib/compute";
import type { PlayerId } from "@/lib/types";
import { cn } from "@/lib/utils";

export function GameCard({
  game,
  weekId,
  playerId,
  focused = false,
}: {
  game: GameView;
  weekId: number;
  playerId: PlayerId;
  focused?: boolean;
}) {
  const pick = playerId === "will" ? game.willPick : game.saraPick;
  const other = playerId === "will" ? game.saraPick : game.willPick;
  const home = teamMeta(game.homeAbbr);
  const locked = game.locked;
  const final = game.status === "final";
  const href = locked ? `/weeks/${weekId}/results` : `/weeks/${weekId}/pick/${game.id}`;
  return (
    <Card
      id={gameAnchorId(game.id)}
      className={cn(
        "scroll-mt-40 scroll-mb-28 overflow-hidden border-white/10 bg-black/40",
        focused && "ring-2 ring-amber-300/80",
        locked && !final && "opacity-70",
      )}
      style={{ borderLeft: `4px solid ${home.primary}` }}
    >
      <Link href={href} className="block min-h-14 p-4 touch-manipulation">
        <div className="flex items-center justify-between gap-2 text-xs text-zinc-400">
          <span>{locked && !final ? formatLockedAt(game.kickoff) : formatKickoffShort(game.kickoff)}</span>
          {final ? (
            <Badge variant="secondary" className="bg-white/5 text-zinc-300">
              Final
            </Badge>
          ) : locked ? (
            <Badge
              variant="secondary"
              className="inline-flex items-center gap-1 border border-amber-400/40 bg-amber-400/15 text-amber-100"
            >
              <Lock className="size-3.5" aria-hidden />
              Locked
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-100">
              Open
            </Badge>
          )}
        </div>
        <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <TeamLogo abbr={game.awayAbbr} className="shrink-0" />
            <div className="min-w-0">
              <div className="font-medium">{game.awayAbbr}</div>
              <div className="text-xs leading-tight text-zinc-500">{game.awayName}</div>
            </div>
          </div>
          <div className="px-1 text-center text-lg font-medium tabular-nums">
            {final || game.homeScore != null || game.awayScore != null ? (
              <span>
                {game.awayScore ?? "–"}–{game.homeScore ?? "–"}
              </span>
            ) : (
              <span className="text-zinc-500">@</span>
            )}
          </div>
          <div className="flex min-w-0 items-center justify-end gap-2 text-right">
            <div className="min-w-0">
              <div className="font-medium">{game.homeAbbr}</div>
              <div className="text-xs leading-tight text-zinc-500">{game.homeName}</div>
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
            {locked
              ? other
                ? `${other.winnerAbbr} · ${bucketRange(other.marginBucket)}`
                : "still out"
              : "hidden until kickoff"}
          </span>
        </div>
      </Link>
    </Card>
  );
}
