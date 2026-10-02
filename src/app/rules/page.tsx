"use client";

import { Card } from "@/components/ui/card";
import { bucketRange } from "@/lib/scoring";

export default function RulesPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-medium text-amber-200 sm:text-3xl">House rules</h1>
        <p className="text-zinc-400">Two chairs. Will and Sara. No passwords. Switch the name at the top and pick your own card.</p>
      </div>
      <Card className="border-white/10 bg-black/40 p-5 space-y-3 text-sm leading-6 text-zinc-300">
        <p>
          Each NFL game gets one winner pick and one winning-margin bucket: 5, 10, 15, or 20. Those are not exact scores.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>5 means {bucketRange(5)}</li>
          <li>10 means {bucketRange(10)}</li>
          <li>15 means {bucketRange(15)}</li>
          <li>20 means {bucketRange(20)}</li>
        </ul>
        <h2 className="text-xl font-medium text-amber-200">Scoring</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Correct winner: 3 points</li>
          <li>Exact margin bucket: +2</li>
          <li>One bucket off (and the winner is right): +1</li>
          <li>Wrong winner: 0, even if the margin would have been pretty</li>
        </ul>
        <p>
          Nail a 24–17 game (margin 7) with the winner and bucket 5: 5 points. Call the same winner with bucket 10: 4 points
          (one bucket off). Pick the other team: nothing.
        </p>
        <p>
          If you get every winner in a finished week, you take a +10 perfect-week bonus on top of game points. Margin misses
          do not kill the bonus — only a wrong winner does.
        </p>
        <h2 className="text-xl font-medium text-amber-200">Locks</h2>
        <p>
          Each game locks at its own kickoff. You can still pick later games in the same week. A blank after lock is a zero
          for that game. Will’s card never overwrites Sara’s.
        </p>
        <h2 className="text-xl font-medium text-amber-200">Ties</h2>
        <p>
          If season points match, the board shows a tie for first. No leftover third-string tiebreaker. Live with it.
        </p>
      </Card>
    </div>
  );
}
