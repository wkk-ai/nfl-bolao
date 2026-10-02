import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { AppShell } from "@/components/app-shell";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

const geist = Geist({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-geist-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bolão NFL 2026 — Will vs Sara",
  description: "Two-player NFL winner-and-margin pool for the 2026 season.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`dark ${geist.variable} h-full antialiased`}>
      <body className={`${geist.className} min-h-full overflow-x-hidden font-normal`}>
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
