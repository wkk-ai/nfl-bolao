"use client";

import { Card } from "@/components/ui/card";
import { bucketRange } from "@/lib/scoring";

export default function RulesPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-medium text-amber-200 sm:text-3xl">House rules</h1>
        <p className="text-zinc-400">
          Two chairs. Will and Sara. This browser asks for the house PIN once, then remembers it. Switch I’m Will / I’m
          Sara at the top after that.
        </p>
      </div>
      <Card className="border-white/10 bg-black/40 p-5 space-y-3 text-sm leading-6 text-zinc-300">
        <p>
          Will and Sara both start at 100. They missed the early weeks, so those games add nothing and take nothing. New
          picks stack on top of 100. Games that already ended stay on the board. From now on, a blank game waits. It is
          not a zero, and it does not move the 100, until the score is allowed out.
        </p>
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
          The +10 perfect-week bonus lands only when every game that week is on the board and every winner was right. A
          game still waiting on a pick does not count yet. A miss or a tie kills the bonus. Margin misses do not.
        </p>
        <h2 className="text-xl font-medium text-amber-200">Locks</h2>
        <p>
          Saving a pick counts right away. There is no extra submit step. You can change that pick until kickoff. After
          kickoff, a saved pick stays. If you have not picked yet, you can still add one after kickoff, including Thursday
          night, because you watch the game late. That late pick cannot be changed.
        </p>
        <p>
          The real score stays hidden until both Will and Sara have a pick for that game. Points for that game are added
          only then. Games that were already over when this rule started keep their scores, and those missed games stay
          closed. The other chair’s pick stays hidden until kickoff, and until you have picked too.
        </p>
        <h2 className="text-xl font-medium text-amber-200">Ties</h2>
        <p>
          A tied NFL game has no winner. Both chairs get 0 for that game, even if they picked a side. If season points
          match, the board shows a tie for first.
        </p>
      </Card>
    </div>
  );
}
