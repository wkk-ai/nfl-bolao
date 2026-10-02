import seed from "@/data/seed.json";

export const dynamicParams = false;

export function generateStaticParams() {
  return seed.weeks.flatMap((week) =>
    week.games.map((game) => ({
      week: String(week.id),
      gameId: game.id,
    })),
  );
}

export default function PickLayout({ children }: { children: React.ReactNode }) {
  return children;
}
