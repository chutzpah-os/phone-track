"use client";

import type { Categoria } from "@phonetrack/shared";
import { LABEL_STATUS } from "@/lib/labels";
import { formatarDataBR } from "@/lib/format";
import { useLojaAtual } from "@/hooks/use-loja-atual";
import { useContagemStatus } from "@/hooks/use-contagens";
import { useResumoDoDia } from "@/hooks/use-resumo";

const CATEGORIAS: { valor: Categoria; label: string }[] = [
  { valor: "lacrado", label: "Lacrados" },
  { valor: "seminovo", label: "Seminovos" },
  { valor: "americano", label: "Americanos" },
];

const ORDEM_MOVIMENTACOES = [
  "vendido",
  "transferido",
  "entrada",
  "assistencia",
  "troca",
  "saiu",
  "continua",
  "outro",
] as const;

const ORDEM_MOVIMENTACOES_MANHA = [
  "vendido",
  "transferido",
  "saiu",
  "assistencia",
  "troca",
  "outro",
] as const;

function LinhaContadores({ contadores }: { contadores: { lacrado: number; seminovo: number; americano: number; total: number } }) {
  return (
    <div className="grid grid-cols-4 gap-2 text-center">
      {CATEGORIAS.map(({ valor, label }) => (
        <div key={valor} className="rounded-md border border-border px-2 py-2">
          <p className="text-lg font-extrabold">{contadores[valor]}</p>
          <p className="text-[10.5px] text-fg-muted">{label}</p>
        </div>
      ))}
      <div className="rounded-md bg-fg px-2 py-2 text-accent">
        <p className="text-lg font-extrabold">{contadores.total}</p>
        <p className="text-[10.5px]">Total</p>
      </div>
    </div>
  );
}

export default function ResumoDoDiaPage() {
  const { lojaId } = useLojaAtual();
  const { data: status, isLoading: carregandoStatus } = useContagemStatus(lojaId);
  const { data: resumo, isLoading: carregandoResumo } = useResumoDoDia(lojaId, status?.data);

  if (carregandoStatus || !lojaId) {
    return <p className="px-5 py-6 text-sm text-fg-muted">Carregando...</p>;
  }

  if (!status?.primeira) {
    return (
      <main className="px-5 py-6">
        <h1 className="text-[24px] font-extrabold">Resumo do Dia</h1>
        <p className="mt-2 text-sm text-fg-muted">Nenhuma contagem foi aberta hoje ainda.</p>
      </main>
    );
  }

  if (!status.final || !status.final.finalizada) {
    return (
      <main className="px-5 py-6">
        <h1 className="text-[24px] font-extrabold">Resumo do Dia</h1>
        <p className="mt-2 text-sm text-fg-muted">
          O resumo é calculado automaticamente assim que a Contagem Final for finalizada.
        </p>
      </main>
    );
  }

  if (carregandoResumo || !resumo) {
    return <p className="px-5 py-6 text-sm text-fg-muted">Calculando resumo...</p>;
  }

  return (
    <main className="flex flex-col gap-5 px-5 py-5">
      <div>
        <h1 className="text-[24px] font-extrabold">Resumo do Dia</h1>
        <p className="text-sm text-fg-muted">{formatarDataBR(resumo.data)} · Loja Centro</p>
      </div>

      <section className="flex flex-col gap-2">
        <p className="text-xs font-bold uppercase tracking-wide text-fg-muted">
          Primeira Contagem
        </p>
        <LinhaContadores contadores={resumo.primeiraContadores} />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-xs font-bold uppercase tracking-wide text-fg-muted">
          Movimentações da manhã
        </p>
        <p className="text-xs text-fg-muted">Aparelhos não encontrados já na Primeira Contagem</p>
        <div className="flex flex-col gap-1 rounded-md border border-border px-3 py-2 text-sm">
          {ORDEM_MOVIMENTACOES_MANHA.map((status) => (
            <div key={status} className="flex justify-between border-b border-border/50 py-1 last:border-0">
              <span className="text-fg-muted">{LABEL_STATUS[status]}</span>
              <span className="font-semibold">{resumo.movimentacoesManha[status]}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="rounded-md bg-surface-soft px-4 py-3">
        <p className="text-lg font-extrabold">Total Esperado: {resumo.totalEsperado}</p>
        <p className="text-xs text-fg-muted">Primeira Contagem − Saídas + Entradas</p>
      </div>

      <section className="flex flex-col gap-2">
        <p className="text-xs font-bold uppercase tracking-wide text-fg-muted">
          Movimentações do fechamento
        </p>
        <div className="flex flex-col gap-1 rounded-md border border-border px-3 py-2 text-sm">
          {ORDEM_MOVIMENTACOES.map((status) => (
            <div key={status} className="flex justify-between border-b border-border/50 py-1 last:border-0">
              <span className="text-fg-muted">{LABEL_STATUS[status]}</span>
              <span className="font-semibold">{resumo.movimentacoes[status]}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-xs font-bold uppercase tracking-wide text-fg-muted">Contagem Final</p>
        <LinhaContadores contadores={resumo.finalContadores} />
      </section>

      {resumo.statusFinal === "ok" ? (
        <div className="rounded-md bg-fg px-4 py-3 text-center text-sm font-bold text-accent">
          ✅ Tudo correto (Total Esperado = Contagem Final)
        </div>
      ) : (
        <div className="flex flex-col gap-2 rounded-md border-[1.5px] border-fg bg-surface-soft px-4 py-3">
          <p className="text-sm font-bold">
            ⚠ Divergência encontrada: {resumo.totalEsperado - resumo.finalContadores.total >= 0 ? "+" : ""}
            {resumo.totalEsperado - resumo.finalContadores.total} aparelhos
          </p>
          {resumo.divergentes.length > 0 && (
            <ul className="flex flex-col gap-1">
              {resumo.divergentes.map((d) => (
                <li key={d.deviceId} className="text-xs text-fg-muted">
                  {d.nome} — {d.motivo}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </main>
  );
}
