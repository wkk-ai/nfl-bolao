"use client";

import { useEffect, useState } from "react";
import { gameAnchorId } from "./compute";

export function readFocusGameId() {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("g");
}

export function useFocusGameId() {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => {
    setId(readFocusGameId());
  }, []);
  return id;
}

export function useScrollToGame(ready: boolean) {
  const id = useFocusGameId();
  useEffect(() => {
    if (!ready || !id) return;
    const el = document.getElementById(gameAnchorId(id));
    if (!el) return;
    el.scrollIntoView({ block: "center", behavior: "auto" });
  }, [ready, id]);
  return id;
}
