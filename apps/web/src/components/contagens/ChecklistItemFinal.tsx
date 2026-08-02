"use client";

import { useState } from "react";
import type { CountItem, StatusContagemFinal } from "@phonetrack/shared";
import { StatusCircle } from "@/components/ui/StatusCircle";

const OPCOES: { valor: StatusContagemFinal; label: string }[] = [
  { valor: "continua", label: "Continua na loja" },
  { valor: "entrada", label: "Entrada" },
  { valor: "vendido", label: "Vendido" },
  { valor: "transferido", label: "Transferido" },
  { valor: "saiu", label: "Saiu" },
  { valor: "assistencia", label: "Assistência" },
  { valor: "troca", label: "Troca" },
  { valor: "outro", label: "Outro" },
];

const LABEL_POR_VALOR = Object.fromEntries(OPCOES.map((o) => [o.valor, o.label])) as Record<
  StatusContagemFinal,
  string
>;

export function ChecklistItemFinal({
  item,
  expanded,
  disabled,
  onToggleExpand,
  onSelecionarStatus,
}: {
  item: CountItem;
  expanded: boolean;
  disabled?: boolean;
  onToggleExpand: () => void;
  onSelecionarStatus: (status: StatusContagemFinal, observacao?: string) => void;
}) {
  const [observacao, setObservacao] = useState(item.observacao ?? "");
  const [modoOutro, setModoOutro] = useState(item.status === "outro");
  const status = item.status as StatusContagemFinal | undefined;
  const mostrarCampoObservacao = status === "outro" || modoOutro;

  return (
    <div className="rounded-md border-[1.5px] border-border bg-bg px-3.5 py-3">
      <button
        onClick={onToggleExpand}
        disabled={disabled}
        className="flex w-full items-center gap-3 text-left disabled:opacity-70"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14.5px] font-semibold">{item.nome}</span>
          <span className="block truncate text-xs text-fg-muted">
            {item.marca} · {item.modelo}
          </span>
        </span>
        {status || modoOutro ? (
          <span className="rounded-pill bg-fg px-2.5 py-1 text-[11px] font-bold text-accent">
            {LABEL_POR_VALOR[status ?? "outro"]}
          </span>
        ) : (
          <StatusCircle marcado={false} />
        )}
      </button>

      {expanded && !disabled && (
        <div className="mt-3 grid grid-cols-2 gap-1.5">
          {OPCOES.map((opcao) => (
            <button
              key={opcao.valor}
              onClick={() => {
                if (opcao.valor === "outro") {
                  setModoOutro(true);
                  onToggleExpand();
                } else {
                  onSelecionarStatus(opcao.valor);
                }
              }}
              className={`rounded-md py-2 text-xs font-bold ${
                status === opcao.valor
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
            if (observacao.trim()) onSelecionarStatus("outro", observacao.trim());
          }}
          placeholder="Observação (obrigatória)"
          disabled={disabled}
          className="mt-3 w-full rounded-md border-[1.5px] border-border bg-surface-soft px-3 py-2 text-sm outline-none focus:border-fg"
        />
      )}
    </div>
  );
}
