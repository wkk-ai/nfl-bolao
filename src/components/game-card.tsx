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

function TeamBlock({
  abbr,
  name,
  align = "left",
}: {
  abbr: string;
  name: string;
  align?: "left" | "right";
}) {
  return (
    <div className={cn("min-w-0 flex-1", align === "right" && "text-right")}>
      <div className="font-medium">{abbr}</div>
      <div className="text-xs leading-snug break-words text-zinc-500">{name}</div>
    </div>
  );
}

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
  const showScore = game.homeScore != null && game.awayScore != null;
  const href = locked ? `/weeks/${weekId}/results` : `/weeks/${weekId}/pick/${game.id}`;
  return (
    <Card
      id={gameAnchorId(game.id)}
      className={cn(
        "scroll-mt-40 scroll-mb-32 overflow-visible border-white/10 bg-black/40",
        focused && "ring-2 ring-amber-300/80",
        locked && !final && "opacity-70",
      )}
      style={{ borderLeft: `4px solid ${home.primary}` }}
    >
      <Link href={href} className="block min-h-14 p-4 touch-manipulation">
        <div className="flex items-center justify-between gap-2 text-xs text-zinc-400">
          <span>
            {locked && !showScore && game.scoresPublic
              ? formatLockedAt(game.kickoff)
              : formatKickoffShort(game.kickoff)}
          </span>
          {final && showScore ? (
            <Badge variant="secondary" className="bg-white/5 text-zinc-300">
              Final
            </Badge>
          ) : showScore ? (
            <Badge variant="secondary" className="bg-white/5 text-zinc-300">
              Live
            </Badge>
          ) : !locked && game.status === "in_progress" ? (
            <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-100">
              Pick still open
            </Badge>
          ) : locked ? (
            <Badge
              variant="secondary"
              className="inline-flex items-center gap-1 border border-amber-400/40 bg-amber-400/15 text-amber-100"
            >
              <Lock className="size-3.5" aria-hidden />
              {game.scoresPublic ? "Locked" : "Score hidden"}
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-100">
              Open
            </Badge>
          )}
        </div>
        <div className="mt-3 space-y-2 md:hidden">
          <div className="flex items-start gap-2">
            <TeamLogo abbr={game.awayAbbr} className="shrink-0" />
            <TeamBlock abbr={game.awayAbbr} name={game.awayName} />
            {showScore ? (
              <span className="shrink-0 text-lg font-medium tabular-nums">{game.awayScore}</span>
            ) : null}
          </div>
          <p className="pl-12 text-[11px] text-zinc-500">at</p>
          <div className="flex items-start gap-2">
            <TeamLogo abbr={game.homeAbbr} className="shrink-0" />
            <TeamBlock abbr={game.homeAbbr} name={game.homeName} />
            {showScore ? (
              <span className="shrink-0 text-lg font-medium tabular-nums">{game.homeScore}</span>
            ) : null}
          </div>
        </div>
        <div className="mt-3 hidden grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 md:grid">
          <div className="flex min-w-0 items-center gap-2">
            <TeamLogo abbr={game.awayAbbr} className="shrink-0" />
            <TeamBlock abbr={game.awayAbbr} name={game.awayName} />
          </div>
          <div className="px-1 text-center text-lg font-medium tabular-nums">
            {showScore ? (
              <span>
                {game.awayScore}–{game.homeScore}
              </span>
            ) : (
              <span className="text-zinc-500">@</span>
            )}
          </div>
          <div className="flex min-w-0 items-center justify-end gap-2">
            <TeamBlock abbr={game.homeAbbr} name={game.homeName} align="right" />
            <TeamLogo abbr={game.homeAbbr} className="shrink-0" />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className={cn("rounded-md px-2 py-1", pick ? "bg-amber-400/15 text-amber-200" : "bg-white/5 text-zinc-500")}>
            You: {pick ? `${pick.winnerAbbr} · ${bucketRange(pick.marginBucket)}` : "no pick"}
          </span>
          <span className="rounded-md bg-white/5 px-2 py-1 text-zinc-400">
            {playerId === "will" ? "Sara" : "Will"}:{" "}
            {other
              ? `${other.winnerAbbr} · ${bucketRange(other.marginBucket)}`
              : game.scoresPublic && locked
                ? "still out"
                : "hidden until you both pick"}
          </span>
        </div>
      </Link>
    </Card>
  );
}
