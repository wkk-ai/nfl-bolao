"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, Calendar, Home, BookOpen, Medal, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/weeks", label: "Weeks", icon: Calendar },
  { href: "/leaderboard", label: "Board", icon: Trophy },
  { href: "/history", label: "History", icon: History },
  { href: "/badges", label: "Badges", icon: Medal },
  { href: "/rules", label: "Rules", icon: BookOpen },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { activePlayer, setActivePlayer, demo, ready } = useStore();

  return (
    <div className="min-h-full bg-[var(--turf)] text-zinc-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(232,184,74,0.12),transparent_45%),radial-gradient(ellipse_at_bottom,rgba(31,138,76,0.18),transparent_40%)]" />
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link href="/" className="font-heading text-lg tracking-wide text-amber-300">
            BOLÃO NFL ’26
          </Link>
          <nav className="ml-4 hidden items-center gap-1 md:flex">
            {NAV.map((item) => {
              const active = item.href === "/" ? path === "/" : path.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm",
                    active ? "bg-amber-300/15 text-amber-200" : "text-zinc-400 hover:text-zinc-100",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {demo && ready ? (
              <Badge variant="secondary" className="hidden border-amber-400/30 bg-amber-400/10 text-amber-200 sm:inline-flex">
                Demo data
              </Badge>
            ) : null}
            <div className="flex rounded-lg border border-white/15 bg-black/40 p-0.5">
              <Button
                size="sm"
                variant={activePlayer === "will" ? "default" : "ghost"}
                className={cn(
                  "h-8",
                  activePlayer === "will" && "bg-amber-400 text-black hover:bg-amber-300",
                )}
                onClick={() => setActivePlayer("will")}
              >
                I’m Will
              </Button>
              <Button
                size="sm"
                variant={activePlayer === "sara" ? "default" : "ghost"}
                className={cn(
                  "h-8",
                  activePlayer === "sara" && "bg-cyan-400 text-black hover:bg-cyan-300",
                )}
                onClick={() => setActivePlayer("sara")}
              >
                I’m Sara
              </Button>
            </div>
          </div>
        </div>
      </header>
      <main className="relative mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-24 md:pb-10">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/85 px-2 py-2 backdrop-blur md:hidden">
        <div className="grid grid-cols-6 gap-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = item.href === "/" ? path === "/" : path.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-md py-1 text-[10px]",
                  active ? "text-amber-300" : "text-zinc-500",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
