"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageLoading } from "@/components/states";
import { useStore } from "@/lib/store";
import { deriveWeekState, weekStateLabel } from "@/lib/week-state";
import { pickFor, weekPoints } from "@/lib/compute";

export default function WeeksPage() {
  const { ready, weeks, picks, activePlayer } = useStore();
  if (!ready) return <PageLoading />;
  const seasonWeeks = weeks.length || 18;
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-medium text-zinc-500">2026 regular season · {seasonWeeks} weeks</p>
        <h1 className="text-2xl font-medium text-amber-200 sm:text-3xl">Weeks</h1>
        <p className="text-zinc-400">
          Full ESPN slate. Open weeks take picks. Missed early weeks stay on the board and do not change the 100-point start.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {weeks.map((week) => {
          const state = deriveWeekState(week);
          const pts = weekPoints(week, picks, activePlayer);
          const hadPick = week.games.some((g) => pickFor(picks, activePlayer, g.id));
          const missed = (state === "final" || state === "locked") && !hadPick;
          return (
            <Link key={week.id} href={`/weeks/${week.id}`} className="block min-h-14">
              <Card className="border-white/10 bg-black/40 p-4 transition hover:border-amber-400/40">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-medium">{week.label}</h2>
                  <Badge className="bg-white/10">{weekStateLabel(state)}</Badge>
                </div>
                <p className="mt-2 text-sm text-zinc-400">
                  {week.games.length} games
                  {missed
                    ? " · missed — no card, score unchanged"
                    : ` · your ${pts.total} pts`}
                  {pts.bonus ? ` including +${pts.bonus} perfect-week bonus` : ""}
                </p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full bg-amber-400"
                    style={{ width: `${(week.id / seasonWeeks) * 100}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  Season progress through week {week.id} of {seasonWeeks}
                </p>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
