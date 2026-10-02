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
      <h1 className="text-2xl font-medium text-red-100">Something broke</h1>
      <p className="mt-2 text-sm text-red-100/80">{error.message || "The page could not load."}</p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-4 inline-flex min-h-11 items-center rounded-md bg-white/10 px-4 text-sm font-medium"
      >
        Try again
      </button>
    </div>
  );
}
