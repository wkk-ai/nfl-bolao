"use client";

import Link from "next/link";
import type { VariantProps } from "class-variance-authority";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ButtonLink({
  href,
  children,
  variant,
  size,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
} & VariantProps<typeof buttonVariants>) {
  return (
    <Link
      href={href}
      className={cn(buttonVariants({ variant, size }), "min-h-11 px-4 touch-manipulation", className)}
    >
      {children}
    </Link>
  );
}
