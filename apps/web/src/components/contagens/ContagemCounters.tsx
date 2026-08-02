import type { ContadoresContagem } from "@phonetrack/shared";

const LABELS: { chave: keyof ContadoresContagem["porCategoria"]; label: string }[] = [
  { chave: "lacrado", label: "Lacrados" },
  { chave: "seminovo", label: "Seminovos" },
  { chave: "americano", label: "Americanos" },
];

export function ContagemCounters({ contadores }: { contadores: ContadoresContagem }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {LABELS.map(({ chave, label }) => (
        <div key={chave} className="rounded-md border border-border px-3 py-2 text-sm">
          {label} {contadores.porCategoria[chave].conferido}/{contadores.porCategoria[chave].esperado}
        </div>
      ))}
      <div className="col-span-2 rounded-md bg-fg px-3 py-2 text-center text-sm font-bold text-accent">
        Total {contadores.total.conferido}/{contadores.total.esperado}
      </div>
    </div>
  );
}
