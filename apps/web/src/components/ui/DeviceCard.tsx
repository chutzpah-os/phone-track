import type { Aparelho } from "@phonetrack/shared";
import { CategoryBadge } from "./CategoryBadge";

const INITIAL_STYLES: Record<Aparelho["categoria"], string> = {
  lacrado: "bg-fg text-bg",
  seminovo: "bg-accent text-fg",
  americano: "bg-bg text-fg border-[1.5px] border-fg",
};

function iniciais(nome: string): string {
  return nome.slice(0, 2).toUpperCase();
}

export function DeviceCard({
  aparelho,
  onClick,
}: {
  aparelho: Aparelho;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-md border-[1.5px] border-border bg-bg px-3.5 py-3 text-left"
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-xs font-extrabold ${INITIAL_STYLES[aparelho.categoria]}`}
      >
        {iniciais(aparelho.nome)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold">{aparelho.nome}</span>
        <span className="block truncate text-xs text-fg-muted">
          {aparelho.marca} · {aparelho.modelo}
        </span>
      </span>
      <CategoryBadge categoria={aparelho.categoria} />
    </button>
  );
}
