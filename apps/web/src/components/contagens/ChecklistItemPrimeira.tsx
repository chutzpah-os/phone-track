"use client";

import { useState } from "react";
import type { CountItem, StatusPrimeiraContagem } from "@phonetrack/shared";
import { StatusCircle } from "@/components/ui/StatusCircle";

const MOTIVOS: { valor: Exclude<StatusPrimeiraContagem, "presente">; label: string }[] = [
  { valor: "vendido", label: "Vendido" },
  { valor: "transferido", label: "Transferido" },
  { valor: "saiu", label: "Saiu" },
  { valor: "assistencia", label: "Assistência" },
  { valor: "troca", label: "Troca" },
  { valor: "outro", label: "Outro" },
];

const LABEL_POR_VALOR = Object.fromEntries(MOTIVOS.map((o) => [o.valor, o.label])) as Record<
  string,
  string
>;

export function ChecklistItemPrimeira({
  item,
  disabled,
  expanded,
  onToggle,
  onToggleExpand,
  onSelecionarMotivo,
}: {
  item: CountItem;
  disabled?: boolean;
  expanded: boolean;
  onToggle: () => void;
  onToggleExpand: () => void;
  onSelecionarMotivo: (status: Exclude<StatusPrimeiraContagem, "presente">, observacao?: string) => void;
}) {
  const [observacao, setObservacao] = useState(item.observacao ?? "");
  const [modoOutro, setModoOutro] = useState(item.status === "outro");
  const presente = item.status === "presente";
  const motivo = item.status && item.status !== "presente" ? item.status : undefined;
  const mostrarCampoObservacao = motivo === "outro" || modoOutro;

  return (
    <div className="rounded-md border-[1.5px] border-border bg-bg px-3.5 py-3">
      <div className="flex items-center gap-2">
        <button
          onClick={onToggle}
          disabled={disabled}
          className="flex min-w-0 flex-1 items-center gap-3 text-left disabled:opacity-70"
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14.5px] font-semibold">{item.nome}</span>
            <span className="block truncate text-xs text-fg-muted">
              {item.marca} · {item.modelo}
            </span>
          </span>
          {motivo || modoOutro ? (
            <span className="rounded-pill bg-fg px-2.5 py-1 text-[11px] font-bold text-accent">
              {LABEL_POR_VALOR[motivo ?? "outro"]}
            </span>
          ) : (
            <StatusCircle marcado={presente} />
          )}
        </button>

        {!disabled && (
          <button
            onClick={onToggleExpand}
            className="shrink-0 whitespace-nowrap rounded-pill border-[1.5px] border-border px-2.5 py-1.5 text-[11px] font-bold text-fg-muted"
          >
            Não encontrado
          </button>
        )}
      </div>

      {expanded && !disabled && (
        <div className="mt-3 grid grid-cols-2 gap-1.5">
          {MOTIVOS.map((opcao) => (
            <button
              key={opcao.valor}
              onClick={() => {
                if (opcao.valor === "outro") {
                  setModoOutro(true);
                  onToggleExpand();
                } else {
                  onSelecionarMotivo(opcao.valor);
                }
              }}
              className={`rounded-md py-2 text-xs font-bold ${
                motivo === opcao.valor
                  ? "bg-fg text-accent"
                  : "border-[1.5px] border-border bg-bg text-fg"
              }`}
            >
              {opcao.label}
            </button>
          ))}
        </div>
      )}

      {mostrarCampoObservacao && (
        <input
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          onBlur={() => {
            if (observacao.trim()) onSelecionarMotivo("outro", observacao.trim());
          }}
          placeholder="Observação (obrigatória)"
          disabled={disabled}
          className="mt-3 w-full rounded-md border-[1.5px] border-border bg-surface-soft px-3 py-2 text-sm outline-none focus:border-fg"
        />
      )}
    </div>
  );
}
