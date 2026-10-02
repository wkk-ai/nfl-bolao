import type { Metadata } from "next";
import { Geist, Oswald } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { AppShell } from "@/components/app-shell";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bolão NFL 2026 — Will vs Sara",
  description: "Two-player NFL winner-and-margin pool for the 2026 season.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`dark ${geist.variable} ${oswald.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <TooltipProvider>
          <StoreProvider>
            <AppShell>{children}</AppShell>
            <Toaster />
          </StoreProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
