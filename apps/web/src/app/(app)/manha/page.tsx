"use client";

import { Button } from "@/components/ui/Button";
import { PendenciaBanner } from "@/components/contagens/PendenciaBanner";
import { PrimeiraChecklistSection } from "@/components/contagens/PrimeiraChecklistSection";
import { useAuth } from "@/context/auth-context";
import { useLojaAtual } from "@/hooks/use-loja-atual";
import { useAbrirPrimeira, useContagemStatus } from "@/hooks/use-contagens";
import { formatarDataBR } from "@/lib/format";

export default function PrimeiraContagemPage() {
  const { perfil } = useAuth();
  const { lojaId } = useLojaAtual();
  const { data: status, isLoading: carregandoStatus } = useContagemStatus(lojaId);
  const abrirPrimeira = useAbrirPrimeira(lojaId);

  const podeDesbloquear = perfil?.papel === "master" || perfil?.papel === "admin";
  const pendenciasPrimeira = (status?.pendencias ?? []).filter((p) => p.tipo === "primeira");

  if (carregandoStatus || !lojaId) {
    return <p className="px-5 py-6 text-sm text-fg-muted">Carregando...</p>;
  }

  return (
    <main className="flex flex-col gap-6 px-5 py-5">
      <div>
        <h1 className="text-[24px] font-extrabold">Primeira Contagem</h1>
        <p className="text-sm text-fg-muted">{status?.data && formatarDataBR(status.data)}</p>
      </div>

      {pendenciasPrimeira.map((pendencia) => (
        <div key={pendencia.id} className="flex flex-col gap-3 border-b border-border pb-6">
          <p className="text-xs font-bold uppercase tracking-wide text-fg-muted">
            Pendência de {formatarDataBR(pendencia.data)}
          </p>
          {!pendencia.pendencia?.desbloqueadaEm ? (
            <PendenciaBanner lojaId={lojaId} pendencia={pendencia} podeDesbloquear={podeDesbloquear} />
          ) : (
            <PrimeiraChecklistSection lojaId={lojaId} registro={pendencia} />
          )}
        </div>
      ))}

      {status?.bloqueio && !pendenciasPrimeira.some((p) => p.id === status.bloqueio!.id) ? (
        <PendenciaBanner lojaId={lojaId} pendencia={status.bloqueio} podeDesbloquear={podeDesbloquear} />
      ) : status?.bloqueio ? null : !status?.primeira ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-fg-muted">
            Abra a contagem para começar a marcar a presença dos aparelhos.
          </p>
          <Button onClick={() => abrirPrimeira.mutate()} disabled={abrirPrimeira.isPending}>
            {abrirPrimeira.isPending ? "Abrindo..." : "Abrir Primeira Contagem"}
          </Button>
        </div>
      ) : (
        <PrimeiraChecklistSection lojaId={lojaId} registro={status.primeira} />
      )}
    </main>
  );
}
