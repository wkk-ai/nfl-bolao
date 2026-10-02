"use client";

export default function Loading() {
  return (
    <div className="space-y-3">
      <div className="h-8 w-48 animate-pulse rounded bg-white/10" />
      <div className="h-24 animate-pulse rounded-xl bg-white/10" />
      <div className="h-24 animate-pulse rounded-xl bg-white/10" />
    </div>
  );
}
