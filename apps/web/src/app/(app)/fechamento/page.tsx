"use client";

import { Button } from "@/components/ui/Button";
import { PendenciaBanner } from "@/components/contagens/PendenciaBanner";
import { FinalChecklistSection } from "@/components/contagens/FinalChecklistSection";
import { useAuth } from "@/context/auth-context";
import { useLojaAtual } from "@/hooks/use-loja-atual";
import { useAbrirFinal, useContagemStatus } from "@/hooks/use-contagens";
import { formatarDataBR } from "@/lib/format";

export default function ContagemFinalPage() {
  const { perfil } = useAuth();
  const { lojaId } = useLojaAtual();
  const { data: status, isLoading: carregandoStatus } = useContagemStatus(lojaId);
  const abrirFinal = useAbrirFinal(lojaId);

  const podeDesbloquear = perfil?.papel === "master" || perfil?.papel === "admin";
  const pendenciasFinal = (status?.pendencias ?? []).filter((p) => p.tipo === "final");

  if (carregandoStatus || !lojaId) {
    return <p className="px-5 py-6 text-sm text-fg-muted">Carregando...</p>;
  }

  return (
    <main className="flex flex-col gap-6 px-5 py-5">
      <div>
        <h1 className="text-[24px] font-extrabold">Contagem Final</h1>
        <p className="text-sm text-fg-muted">{status?.data && formatarDataBR(status.data)} · Loja Centro</p>
      </div>

      {pendenciasFinal.map((pendencia) => (
        <div key={pendencia.id} className="flex flex-col gap-3 border-b border-border pb-6">
          <p className="text-xs font-bold uppercase tracking-wide text-fg-muted">
            Pendência de {formatarDataBR(pendencia.data)}
          </p>
          {!pendencia.pendencia?.desbloqueadaEm ? (
            <PendenciaBanner lojaId={lojaId} pendencia={pendencia} podeDesbloquear={podeDesbloquear} />
          ) : (
            <FinalChecklistSection lojaId={lojaId} registro={pendencia} permitirAdicionarAparelho={false} />
          )}
        </div>
      ))}

      {status?.bloqueio && !pendenciasFinal.some((p) => p.id === status.bloqueio!.id) ? (
        <PendenciaBanner lojaId={lojaId} pendencia={status.bloqueio} podeDesbloquear={podeDesbloquear} />
      ) : status?.bloqueio ? null : !status?.primeira || !status.primeira.finalizada ? (
        <div className="rounded-md border-[1.5px] border-border px-4 py-3 text-sm text-fg-muted">
          Primeira Contagem ainda não finalizada
        </div>
      ) : !status.final ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-fg-muted">
            Abra o fechamento para marcar o status de cada aparelho.
          </p>
          <Button onClick={() => abrirFinal.mutate()} disabled={abrirFinal.isPending}>
            {abrirFinal.isPending ? "Abrindo..." : "Abrir Contagem Final"}
          </Button>
        </div>
      ) : (
        <FinalChecklistSection lojaId={lojaId} registro={status.final} permitirAdicionarAparelho />
      )}
    </main>
  );
}
