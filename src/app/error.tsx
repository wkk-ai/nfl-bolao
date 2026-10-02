"use client";

export default function ErrorView({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-xl border border-red-500/30 bg-red-950/40 p-6">
      <h1 className="font-heading text-2xl text-red-100">Something broke</h1>
      <p className="mt-2 text-sm text-red-100/80">{error.message || "The page could not load."}</p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-4 rounded-md bg-white/10 px-3 py-1.5 text-sm"
      >
        Try again
      </button>
    </div>
  );
}
