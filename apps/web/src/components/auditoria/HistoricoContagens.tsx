"use client";

import { useState, type ReactNode } from "react";
import type { CountRecord } from "@phonetrack/shared";
import { PrimeiraChecklistSection } from "@/components/contagens/PrimeiraChecklistSection";
import { FinalChecklistSection } from "@/components/contagens/FinalChecklistSection";
import { useContagemPorData } from "@/hooks/use-contagens";
import { formatarDataBR } from "@/lib/format";

function formatarHorario(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function CardRegistro({
  titulo,
  registro,
  tituloVazio,
  children,
}: {
  titulo: string;
  registro: CountRecord | null;
  tituloVazio: string;
  children: ReactNode;
}) {
  const [aberto, setAberto] = useState(false);

  if (!registro) {
    return (
      <div className="rounded-md border border-border px-4 py-3 text-sm text-fg-muted">
        {tituloVazio}
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div>
          <p className="text-sm font-bold">{titulo}</p>
          <p className="text-xs text-fg-muted">
            {registro.finalizada ? "Finalizada" : "Em aberto"} · aberta às{" "}
            {formatarHorario(registro.horarioAbertura)}
          </p>
        </div>
        <span className="text-lg text-fg-muted">{aberto ? "−" : "+"}</span>
      </button>
      {aberto && <div className="border-t border-border px-4 py-4">{children}</div>}
    </div>
  );
}

export function HistoricoContagens({ lojaId }: { lojaId: string | undefined }) {
  const hoje = new Date().toISOString().slice(0, 10);
  const [data, setData] = useState(hoje);
  const { data: resultado, isLoading } = useContagemPorData(lojaId, data);

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-[10.5px] font-bold uppercase tracking-wide text-fg-muted">
          Ver contagens do dia
        </span>
        <input
          type="date"
          value={data}
          max={hoje}
          onChange={(e) => setData(e.target.value)}
          className="w-full rounded-md border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-fg"
        />
      </label>

      {isLoading && <p className="text-sm text-fg-muted">Carregando...</p>}

      {resultado && (
        <>
          <CardRegistro
            titulo="Primeira Contagem"
            registro={resultado.primeira}
            tituloVazio={`Nenhuma Primeira Contagem em ${formatarDataBR(data)}.`}
          >
            {resultado.primeira && (
              <PrimeiraChecklistSection
                lojaId={lojaId}
                registro={{ ...resultado.primeira, finalizada: true }}
              />
            )}
          </CardRegistro>

          <CardRegistro
            titulo="Contagem Final"
            registro={resultado.final}
            tituloVazio={`Nenhuma Contagem Final em ${formatarDataBR(data)}.`}
          >
            {resultado.final && (
              <FinalChecklistSection
                lojaId={lojaId}
                registro={{ ...resultado.final, finalizada: true }}
                permitirAdicionarAparelho={false}
              />
            )}
          </CardRegistro>
        </>
      )}
    </div>
  );
}
