"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageLoading } from "@/components/states";
import { useStore } from "@/lib/store";
import { deriveWeekState, weekStateLabel } from "@/lib/week-state";
import { weekPoints } from "@/lib/compute";

export default function WeeksPage() {
  const { ready, weeks, picks, activePlayer } = useStore();
  if (!ready) return <PageLoading />;
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">2026 season</p>
        <h1 className="font-heading text-4xl text-amber-200">Weeks</h1>
        <p className="text-zinc-400">Open weeks take picks. Final weeks keep the receipts.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {weeks.map((week) => {
          const state = deriveWeekState(week);
          const pts = weekPoints(week, picks, activePlayer);
          return (
            <Link key={week.id} href={`/weeks/${week.id}`}>
              <Card className="border-white/10 bg-black/40 p-4 transition hover:border-amber-400/40">
                <div className="flex items-center justify-between">
                  <h2 className="font-heading text-2xl">{week.label}</h2>
                  <Badge className="bg-white/10">{weekStateLabel(state)}</Badge>
                </div>
                <p className="mt-2 text-sm text-zinc-400">
                  {week.games.length} games · your {pts.total} pts
                  {pts.bonus ? ` including +${pts.bonus} perfect-week bonus` : ""}
                </p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full bg-amber-400"
                    style={{ width: `${(week.id / 18) * 100}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-zinc-500">Season progress through week {week.id} of 18</p>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
