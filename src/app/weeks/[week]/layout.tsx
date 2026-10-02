import seed from "@/data/seed.json";

export const dynamicParams = false;

export function generateStaticParams() {
  return seed.weeks.map((week) => ({ week: String(week.id) }));
}

export default function WeekLayout({ children }: { children: React.ReactNode }) {
  return children;
}
