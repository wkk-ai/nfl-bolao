"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SITE_PIN, rememberGate } from "@/lib/site-pin";

export function SitePinGate({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex min-h-dvh items-end justify-center bg-[var(--turf)] p-4 sm:items-center">
      <form
        className="w-full max-w-sm rounded-xl border border-white/15 bg-zinc-950 p-5 shadow-xl"
        onSubmit={(e) => {
          e.preventDefault();
          if (!/^\d{4}$/.test(pin)) return;
          if (pin !== SITE_PIN) {
            setError("Wrong PIN. Try again.");
            setPin("");
            return;
          }
          rememberGate();
          onUnlock();
        }}
      >
        <h1 className="text-lg font-medium text-amber-200">Enter the house PIN</h1>
        <p className="mt-2 text-sm text-zinc-400">
          One PIN for this site. This browser will remember it and will not ask again.
        </p>
        <Input
          autoFocus
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={4}
          value={pin}
          onChange={(e) => {
            setError(null);
            setPin(e.target.value.replace(/\D/g, "").slice(0, 4));
          }}
          className="mt-4 h-14 text-center text-2xl tracking-[0.4em]"
          aria-label="House PIN"
        />
        {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}
        <Button
          type="submit"
          disabled={!/^\d{4}$/.test(pin)}
          className="mt-4 h-12 min-h-12 w-full bg-amber-400 text-black hover:bg-amber-300"
        >
          Open the board
        </Button>
      </form>
    </div>
  );
}
