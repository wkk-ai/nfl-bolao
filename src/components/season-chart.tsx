"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import type { SeedWeek } from "@/lib/types";
import { seasonTotals } from "@/lib/compute";
import { STARTING_POINTS } from "@/lib/scoring";
import type { PickRecord } from "@/lib/types";

type Row = { name: string; Will: number; Sara: number };

function TieDot({
  cx,
  cy,
  dataKey,
  payload,
}: {
  cx?: number;
  cy?: number;
  dataKey?: string;
  payload?: Row;
}) {
  if (cx == null || cy == null || !payload) return null;
  const tied = payload.Will === payload.Sara;
  if (dataKey === "Will") {
    return <circle cx={cx} cy={cy} r={tied ? 4 : 3} fill="#e8b84a" />;
  }
  if (tied) {
    return <circle cx={cx} cy={cy} r={7} fill="none" stroke="#22d3ee" strokeWidth={2} />;
  }
  return <circle cx={cx} cy={cy} r={3} fill="#22d3ee" />;
}

export function SeasonChart({ weeks, picks }: { weeks: SeedWeek[]; picks: PickRecord[] }) {
  const t = seasonTotals(weeks, picks);
  const data = weeks.reduce<Row[]>((acc, week, i) => {
    const prev = acc[acc.length - 1];
    acc.push({
      name: `W${week.id}`,
      Will: (prev?.Will ?? STARTING_POINTS) + (t.will.byWeek[i]?.pts ?? 0),
      Sara: (prev?.Sara ?? STARTING_POINTS) + (t.sara.byWeek[i]?.pts ?? 0),
    });
    return acc;
  }, []);
  const tiedNow = data.length > 0 && data[data.length - 1].Will === data[data.length - 1].Sara;
  return (
    <Card className="border-white/10 bg-black/40 p-4">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <h3 className="font-medium text-amber-200">Season climb</h3>
        <p className="text-xs text-zinc-400">
          {tiedNow ? "Tied. Dashed cyan over solid gold." : "Gold is Will. Cyan is Sara."}
        </p>
      </div>
      <div className="mb-2 flex flex-wrap gap-4 text-xs">
        <span className="inline-flex items-center gap-2 text-amber-200">
          <span className="inline-block h-0.5 w-6 bg-amber-400" />
          Will
        </span>
        <span className="inline-flex items-center gap-2 text-cyan-200">
          <span className="inline-block h-0.5 w-6 border-t-2 border-dashed border-cyan-400" />
          Sara
        </span>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} />
            <YAxis
              stroke="#a1a1aa"
              fontSize={12}
              allowDecimals={false}
              domain={[(min: number) => Math.min(min, 95), (max: number) => Math.max(max, 105)]}
            />
            <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #27272a" }} />
            <Line
              type="monotone"
              dataKey="Will"
              stroke="#e8b84a"
              strokeWidth={3}
              dot={<TieDot dataKey="Will" />}
              activeDot={{ r: 5, fill: "#e8b84a" }}
            />
            <Line
              type="monotone"
              dataKey="Sara"
              stroke="#22d3ee"
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={<TieDot dataKey="Sara" />}
              activeDot={{ r: 6, fill: "transparent", stroke: "#22d3ee", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
