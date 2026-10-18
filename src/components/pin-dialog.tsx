"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PlayerId } from "@/lib/types";

export function PinDialog({
  open,
  player,
  mode,
  error,
  busy,
  onSubmit,
  onCancel,
}: {
  open: boolean;
  player: PlayerId;
  mode: "set" | "enter";
  error: string | null;
  busy?: boolean;
  onSubmit: (pin: string) => void;
  onCancel: () => void;
}) {
  const [pin, setPin] = useState("");
  const name = player === "will" ? "Will" : "Sara";

  useEffect(() => {
    if (open) setPin("");
  }, [open, player, mode]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
      <form
        className="w-full max-w-sm rounded-xl border border-white/15 bg-zinc-950 p-4 shadow-xl"
        onSubmit={(e) => {
          e.preventDefault();
          if (!/^\d{4}$/.test(pin) || busy) return;
          onSubmit(pin);
        }}
      >
        <h2 className="text-lg font-medium text-amber-200">
          {mode === "set" ? `Set ${name}’s 4-digit code` : `Enter ${name}’s code`}
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          {mode === "set"
            ? "This phone remembers it. The other phone needs the same code to write this card. We only store a hash of it."
            : "This phone does not have the code yet. A wrong code cannot change the card."}
        </p>
        <Input
          autoFocus
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={4}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
          className="mt-4 h-14 text-center text-2xl tracking-[0.4em]"
          aria-label="Four-digit code"
        />
        {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button
            type="submit"
            disabled={!/^\d{4}$/.test(pin) || busy}
            className="h-12 min-h-12 w-full bg-amber-400 text-black hover:bg-amber-300"
          >
            {mode === "set" ? "Save code" : "Use code"}
          </Button>
          <Button type="button" variant="ghost" className="h-12 min-h-12 w-full" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
