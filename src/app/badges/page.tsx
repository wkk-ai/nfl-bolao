"use client";

import { Card } from "@/components/ui/card";
import { PageLoading } from "@/components/states";
import { useStore } from "@/lib/store";
import { badgesFor } from "@/lib/compute";
import { cn } from "@/lib/utils";

export default function BadgesPage() {
  const { ready, weeks, picks, reactions } = useStore();
  if (!ready) return <PageLoading />;
  const will = badgesFor(weeks, picks, reactions, "will");
  const sara = badgesFor(weeks, picks, reactions, "sara");
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-4xl text-amber-200">Badges</h1>
        <p className="text-zinc-400">Little trophies for heaters, blowout calls, and needling.</p>
      </div>
      {([will, sara] as const).map((list, i) => (
        <div key={i}>
          <h2 className="font-heading text-2xl">{i === 0 ? "Will" : "Sara"}</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {list.map((b) => (
              <Card
                key={b.id}
                className={cn(
                  "border-white/10 p-4",
                  b.earned ? "bg-amber-400/10" : "bg-black/30 text-zinc-500",
                )}
              >
                <div className="font-medium">{b.earned ? "Earned" : "Locked"} · {b.title}</div>
                <p className="text-sm text-zinc-400">{b.detail}</p>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
