import type { Categoria } from "@phonetrack/shared";

const LABEL: Record<Categoria, string> = {
  lacrado: "Lacrado",
  seminovo: "Seminovo",
  americano: "Americano",
};

const STYLES: Record<Categoria, string> = {
  lacrado: "bg-fg text-bg",
  seminovo: "bg-accent text-fg",
  americano: "bg-bg text-fg border-[1.5px] border-fg",
};

export function CategoryBadge({ categoria }: { categoria: Categoria }) {
  return (
    <span
      className={`inline-flex items-center rounded-pill px-2.5 py-1 text-[11px] font-bold ${STYLES[categoria]}`}
    >
      {LABEL[categoria]}
    </span>
  );
}
