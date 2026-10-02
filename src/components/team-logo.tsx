"use client";

import Image from "next/image";
import { teamLogo, teamMeta } from "@/lib/teams";
import { cn } from "@/lib/utils";

export function TeamLogo({
  abbr,
  size = 40,
  className,
}: {
  abbr: string;
  size?: number;
  className?: string;
}) {
  const t = teamMeta(abbr);
  return (
    <span
      className={cn("inline-flex items-center justify-center rounded-full", className)}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 30% 30%, ${t.secondary}55, ${t.primary})`,
      }}
    >
      <Image
        src={teamLogo(abbr)}
        alt={t.nick}
        width={size - 6}
        height={size - 6}
        className="object-contain"
        unoptimized
      />
    </span>
  );
}
