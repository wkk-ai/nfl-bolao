export const SITE_PIN = "2222";
export const GATE_KEY = "bolao-nfl-2026-gate";
export const LEGACY_PLAYER_PIN_KEY = "bolao-nfl-2026-pins";

export function gateRemembered(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(GATE_KEY) === "ok";
}

export function rememberGate() {
  localStorage.setItem(GATE_KEY, "ok");
}

export function dropLegacyPlayerPins() {
  try {
    localStorage.removeItem(LEGACY_PLAYER_PIN_KEY);
  } catch {
    /* ignore */
  }
}
