const PALETTES = [
  ["#0aa39a", "#0b1220"],
  ["#1f6feb", "#0b1220"],
  ["#c45c26", "#1a120c"],
  ["#7c3aed", "#12081f"],
  ["#0f766e", "#052e2b"],
  ["#b45309", "#1c1207"],
] as const;

export function coverGradient(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const [a, b] = PALETTES[hash % PALETTES.length] ?? PALETTES[0];
  return `linear-gradient(135deg, ${a} 0%, ${b} 100%)`;
}

export function formatEventDay(iso: string | null): { day: string; month: string } | null {
  if (!iso) return null;
  const date = new Date(iso);
  return {
    day: date.toLocaleDateString("pt-BR", { day: "2-digit" }),
    month: date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
  };
}

export function formatEventWhen(iso: string | null): string {
  if (!iso) return "Data a definir";
  return new Date(iso).toLocaleString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
