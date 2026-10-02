"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, Calendar, Home, BookOpen, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/weeks", label: "Weeks", icon: Calendar },
  { href: "/leaderboard", label: "Board", icon: Trophy },
  { href: "/history", label: "History", icon: History },
  { href: "/rules", label: "Rules", icon: BookOpen },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { activePlayer, setActivePlayer, demo, ready } = useStore();

  return (
    <div className="min-h-dvh overflow-x-hidden bg-[var(--turf)] text-zinc-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(232,184,74,0.1),transparent_45%),radial-gradient(ellipse_at_bottom,rgba(31,138,76,0.16),transparent_40%)]" />
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-3 py-3 sm:px-4 md:flex-row md:items-center">
          <div className="flex min-w-0 items-center justify-between gap-2">
            <Link href="/" className="truncate text-base font-medium text-amber-200">
              Bolão NFL ’26
            </Link>
            {demo && ready ? (
              <Badge variant="secondary" className="shrink-0 border-amber-400/30 bg-amber-400/10 text-amber-200">
                Demo data
              </Badge>
            ) : null}
          </div>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => {
              const active = item.href === "/" ? path === "/" : path.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "min-h-11 touch-manipulation rounded-md px-3 py-2 text-sm",
                    active ? "bg-amber-300/15 text-amber-200" : "text-zinc-400 hover:text-zinc-100",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="grid w-full grid-cols-2 gap-1 rounded-lg border border-white/15 bg-black/40 p-1 md:ml-auto md:w-auto md:min-w-[220px]">
            <Button
              size="lg"
              variant={activePlayer === "will" ? "default" : "ghost"}
              className={cn(
                "h-11 min-h-11 w-full",
                activePlayer === "will" && "bg-amber-400 text-black hover:bg-amber-300",
              )}
              onClick={() => setActivePlayer("will")}
            >
              I’m Will
            </Button>
            <Button
              size="lg"
              variant={activePlayer === "sara" ? "default" : "ghost"}
              className={cn(
                "h-11 min-h-11 w-full",
                activePlayer === "sara" && "bg-cyan-400 text-black hover:bg-cyan-300",
              )}
              onClick={() => setActivePlayer("sara")}
            >
              I’m Sara
            </Button>
          </div>
        </div>
      </header>
      <main className="relative mx-auto w-full min-w-0 max-w-6xl flex-1 px-3 py-5 pb-28 sm:px-4 md:pb-10">
        {children}
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/90 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <div className="grid grid-cols-5">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = item.href === "/" ? path === "/" : path.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-h-14 min-w-0 flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium touch-manipulation",
                  active ? "text-amber-300" : "text-zinc-500",
                )}
              >
                <Icon className="size-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
