"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageLoading } from "@/components/states";
import { useStore } from "@/lib/store";
import { deriveWeekState, weekStateLabel } from "@/lib/week-state";
import { pickFor, weekPoints, weekScoreCap } from "@/lib/compute";

export default function WeeksPage() {
  const { ready, weeks, picks } = useStore();
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
          const willPts = weekPoints(week, picks, "will");
          const saraPts = weekPoints(week, picks, "sara");
          const cap = weekScoreCap(week);
          const willHad = week.games.some((g) => pickFor(picks, "will", g.id));
          const saraHad = week.games.some((g) => pickFor(picks, "sara", g.id));
          const missed = (state === "final" || state === "locked") && !willHad && !saraHad;
          const fill = (n: number) => (cap <= 0 ? 0 : Math.min(100, (n / cap) * 100));
          return (
            <Link key={week.id} href={`/weeks/${week.id}`} className="block min-h-14">
              <Card className="border-white/10 bg-black/40 p-4 transition hover:border-amber-400/40">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-medium">{week.label}</h2>
                  <Badge className="bg-white/10">{weekStateLabel(state)}</Badge>
                </div>
                <p className="mt-2 text-sm text-zinc-400">
                  {week.games.length} games
                  {missed ? " · missed — no card, score unchanged" : null}
                  {willPts.bonus || saraPts.bonus ? " · perfect-week bonus is in the total" : null}
                </p>
                <p className="mt-2 text-sm">
                  <span className="text-amber-200">Will {willPts.total}</span>
                  <span className="text-zinc-500"> · </span>
                  <span className="text-cyan-200">Sara {saraPts.total}</span>
                </p>
                <div className="mt-3 space-y-1.5">
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full bg-amber-400" style={{ width: `${fill(willPts.total)}%` }} />
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full bg-cyan-400" style={{ width: `${fill(saraPts.total)}%` }} />
                  </div>
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  {cap === 0
                    ? "No finals yet — the bar stays empty."
                    : `${willPts.gamesFinal} final${willPts.gamesFinal === 1 ? "" : "s"} · ${cap} pts on the table`}
                </p>
              </Card>
            </Link>
          );
        })}
      </div>
      <div className="h-24 md:hidden" aria-hidden />
    </div>
  );
}
