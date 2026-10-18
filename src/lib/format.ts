export function formatKickoff(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
    timeZoneName: "short",
  }).format(d);
}

export function formatKickoffShort(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  }).format(d);
}

export function formatLockedAt(iso: string): string {
  const t = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  }).format(new Date(iso));
  return `Locked at ${t}`;
}

export function otherPlayer(id: "will" | "sara"): "will" | "sara" {
  return id === "will" ? "sara" : "will";
}
