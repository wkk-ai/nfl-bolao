"use client";

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { RankRow } from "@/lib/compute";

export function GapMeter({ ranks }: { ranks: RankRow[] }) {
  const will = ranks.find((r) => r.playerId === "will")!;
  const sara = ranks.find((r) => r.playerId === "sara")!;
  const max = Math.max(will.pts, sara.pts, 1);
  const gap = Math.abs(will.pts - sara.pts);
  const leader = will.pts === sara.pts ? null : will.pts > sara.pts ? "Will" : "Sara";
  return (
    <Card className="border-white/10 bg-black/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="text-amber-200">Will {will.pts}</span>
        <span className="text-zinc-400">
          {leader ? `${leader} by ${gap}` : will.pts === 100 ? "Tied at 100." : "Tied. Split the pot energy."}
        </span>
        <span className="text-cyan-200">Sara {sara.pts}</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Progress value={(will.pts / max) * 100} className="h-2 bg-white/10" />
        <Progress value={(sara.pts / max) * 100} className="h-2 bg-white/10" />
      </div>
    </Card>
  );
}
