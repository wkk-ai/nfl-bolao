"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import type { SeedWeek } from "@/lib/types";
import { seasonTotals } from "@/lib/compute";
import type { PickRecord } from "@/lib/types";

export function SeasonChart({ weeks, picks }: { weeks: SeedWeek[]; picks: PickRecord[] }) {
  const t = seasonTotals(weeks, picks);
  const data = weeks.reduce<{ name: string; Will: number; Sara: number }[]>((acc, week, i) => {
    const prev = acc[acc.length - 1];
    acc.push({
      name: `W${week.id}`,
      Will: (prev?.Will ?? 0) + (t.will.byWeek[i]?.pts ?? 0),
      Sara: (prev?.Sara ?? 0) + (t.sara.byWeek[i]?.pts ?? 0),
    });
    return acc;
  }, []);
  return (
    <Card className="border-white/10 bg-black/40 p-4">
      <h3 className="mb-3 font-medium text-amber-200">Season climb</h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} />
            <YAxis stroke="#a1a1aa" fontSize={12} />
            <Tooltip
              contentStyle={{ background: "#0a0a0a", border: "1px solid #27272a" }}
            />
            <Line type="monotone" dataKey="Will" stroke="#e8b84a" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Sara" stroke="#22d3ee" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
