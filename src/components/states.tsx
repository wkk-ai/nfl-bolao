"use client";

export function PageLoading({ label = "Loading the slate…" }: { label?: string }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-400">{label}</p>
      <div className="h-28 animate-pulse rounded-xl bg-white/10" />
      <div className="h-28 animate-pulse rounded-xl bg-white/10" />
      <div className="h-28 animate-pulse rounded-xl bg-white/10" />
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-dashed border-white/15 bg-black/30 px-5 py-10 text-center">
      <h2 className="font-heading text-xl text-amber-200">{title}</h2>
      <p className="mt-2 text-sm text-zinc-400">{body}</p>
    </div>
  );
}

export function ErrorState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-red-500/30 bg-red-950/40 px-5 py-8">
      <h2 className="font-medium text-red-200">{title}</h2>
      <p className="mt-2 text-sm text-red-200/80">{body}</p>
    </div>
  );
}
