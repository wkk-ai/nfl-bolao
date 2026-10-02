import Link from "next/link";

export default function NotFound() {
  return (
    <div className="rounded-xl border border-white/10 bg-black/40 p-6">
      <h1 className="font-heading text-2xl text-amber-200">Page not on the card</h1>
      <p className="mt-2 text-sm text-zinc-400">That route is not part of the 2026 bolão.</p>
      <Link href="/" className="mt-4 inline-block text-amber-200">
        Back home
      </Link>
    </div>
  );
}
