"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { GapMeter } from "@/components/gap-meter";
import { SeasonChart } from "@/components/season-chart";
import { PageLoading } from "@/components/states";
import { useStore } from "@/lib/store";
import { ranked, seasonTotals, winnerStreak } from "@/lib/compute";
import { cn } from "@/lib/utils";

export default function LeaderboardPage() {
  const { ready, weeks, picks } = useStore();
  if (!ready) return <PageLoading />;
  const ranks = ranked(weeks, picks);
  const totals = seasonTotals(weeks, picks);
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-4xl text-amber-200">Season board</h1>
        <p className="text-zinc-400">
          {ranks[0].tied
            ? "Will and Sara are dead even. The next Sunday breaks the tie — or doesn’t."
            : `${ranks[0].name} wears first. ${ranks[1].name} is ${ranks[0].pts - ranks[1].pts} back.`}
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {ranks.map((r) => (
          <Link key={r.playerId} href={`/players/${r.playerId}`}>
            <Card
              className={cn(
                "border-white/10 bg-black/40 p-5",
                r.playerId === "will" ? "border-l-4 border-l-amber-400" : "border-l-4 border-l-cyan-400",
              )}
            >
              <div className="text-xs text-zinc-500">
                {r.tied ? "T-1" : `#${r.rank}`}
              </div>
              <div className="font-heading text-4xl">{r.name}</div>
              <div className="text-2xl text-amber-200">{r.pts} pts</div>
              <div className="text-sm text-zinc-400">
                Winner streak {winnerStreak(weeks, picks, r.playerId)}
              </div>
            </Card>
          </Link>
        ))}
      </div>
      <GapMeter ranks={ranks} />
      <SeasonChart weeks={weeks} picks={picks} />
      <Card className="overflow-x-auto border-white/10 bg-black/40 p-4">
        <table className="w-full text-sm">
          <thead className="text-left text-zinc-500">
            <tr>
              <th className="py-2">Week</th>
              <th>Will</th>
              <th>Sara</th>
            </tr>
          </thead>
          <tbody>
            {weeks.map((w, i) => (
              <tr key={w.id} className="border-t border-white/10">
                <td className="py-2">
                  <Link href={`/weeks/${w.id}/results`} className="text-amber-200">
                    {w.label}
                  </Link>
                </td>
                <td>{totals.will.byWeek[i]?.pts ?? 0}</td>
                <td>{totals.sara.byWeek[i]?.pts ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
