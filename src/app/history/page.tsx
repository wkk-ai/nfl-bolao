"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { PageLoading } from "@/components/states";
import { useStore } from "@/lib/store";
import { weekPoints, weeklyAwards } from "@/lib/compute";
import { deriveWeekState, weekStateLabel } from "@/lib/week-state";

export default function HistoryPage() {
  const { ready, weeks, picks } = useStore();
  if (!ready) return <PageLoading />;
  const past = weeks.filter((w) => deriveWeekState(w) === "final" || w.games.some((g) => g.status === "final"));
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-4xl text-amber-200">History</h1>
        <p className="text-zinc-400">Finished (and partly finished) weeks. The receipts live here.</p>
      </div>
      <div className="space-y-3">
        {past.map((w) => {
          const will = weekPoints(w, picks, "will");
          const sara = weekPoints(w, picks, "sara");
          const awards = weeklyAwards(w, picks);
          return (
            <Card key={w.id} className="border-white/10 bg-black/40 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-heading text-2xl">{w.label}</div>
                  <div className="text-xs text-zinc-500">{weekStateLabel(deriveWeekState(w))}</div>
                </div>
                <div className="text-sm">
                  Will {will.total} · Sara {sara.total}
                </div>
              </div>
              {awards[0] ? <p className="mt-2 text-sm text-zinc-400">{awards[0].detail}</p> : null}
              <Link href={`/weeks/${w.id}/results`} className="mt-2 inline-block text-sm text-amber-200">
                Open reveal →
              </Link>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
