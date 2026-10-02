export const dynamicParams = false;

export function generateStaticParams() {
  return [{ id: "will" }, { id: "sara" }];
}

export default function PlayerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
