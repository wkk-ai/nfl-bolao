"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useStore } from "@/lib/store";
import type { PlayerId } from "@/lib/types";

const CHIPS = [
  { emoji: "🔥", body: "That's a gift." },
  { emoji: "😏", body: "See you Sunday." },
  { emoji: "😬", body: "Greedy margin." },
  { emoji: "🏆", body: "Pay the tax." },
];

export function ReactionBar({ weekId, from }: { weekId: number; from: PlayerId }) {
  const { addReaction, reactions } = useStore();
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState("");
  const mine = reactions.filter((r) => r.weekId === weekId);
  return (
    <div className="rounded-xl border border-white/10 bg-black/40 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-heading text-amber-200">Needling</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button size="sm" variant="outline" />}>
            Custom jab
          </DialogTrigger>
          <DialogContent className="border-white/10 bg-zinc-950">
            <DialogHeader>
              <DialogTitle>Send a line</DialogTitle>
            </DialogHeader>
            <Input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="Keep it short. Keep it mean."
            />
            <Button
              onClick={() => {
                if (!custom.trim()) return;
                addReaction(weekId, "💬", custom.trim());
                setCustom("");
                setOpen(false);
              }}
            >
              Send as {from === "will" ? "Will" : "Sara"}
            </Button>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex flex-wrap gap-2">
        {CHIPS.map((c) => (
          <Button key={c.body} size="sm" variant="secondary" onClick={() => addReaction(weekId, c.emoji, c.body)}>
            {c.emoji} {c.body}
          </Button>
        ))}
      </div>
      <ul className="mt-4 space-y-2 text-sm">
        {mine.length === 0 ? <li className="text-zinc-500">No jabs yet this week.</li> : null}
        {mine.map((r) => (
          <li key={r.id} className="rounded-md bg-white/5 px-3 py-2">
            <span className="mr-2">{r.emoji}</span>
            <span className="text-zinc-300">{r.fromPlayerId === "will" ? "Will" : "Sara"}:</span> {r.body}
          </li>
        ))}
      </ul>
    </div>
  );
}
