"use client";

import { useState } from "react";
import type { AuditLog } from "@phonetrack/shared";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { AuditLogDetailModal } from "@/components/auditoria/AuditLogDetailModal";
import { HistoricoContagens } from "@/components/auditoria/HistoricoContagens";
import { DeviceDetailSheet } from "@/components/aparelhos/DeviceDetailSheet";
import { LABEL_ACAO_AUDITORIA } from "@/lib/labels";
import { useAuth } from "@/context/auth-context";
import { useLojaAtual } from "@/hooks/use-loja-atual";
import { useAuditoria } from "@/hooks/use-auditoria";

type Aba = "auditoria" | "contagens";

function formatarTimestamp(valor: unknown): string {
  const ts = valor as { _seconds?: number } | string | undefined;
  if (ts && typeof ts === "object" && typeof ts._seconds === "number") {
    return new Date(ts._seconds * 1000).toLocaleString("pt-BR");
  }
  if (typeof ts === "string") {
    return new Date(ts).toLocaleString("pt-BR");
  }
  return "—";
}

export default function AnalisePage() {
  const { perfil } = useAuth();
  const { lojaId } = useLojaAtual();
  const podeVer = perfil?.papel === "master" || perfil?.papel === "admin";

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useAuditoria(
    podeVer ? lojaId : undefined,
  );
  const [logSelecionado, setLogSelecionado] = useState<AuditLog | null>(null);
  const [aparelhoSelecionado, setAparelhoSelecionado] = useState<string | null>(null);
  const [aba, setAba] = useState<Aba>("auditoria");

  if (!podeVer) {
    return (
      <main className="px-5 py-6">
        <h1 className="text-[24px] font-extrabold">Análise</h1>
        <p className="mt-2 text-sm text-fg-muted">
          Acesso restrito a Admin e Master.
        </p>
      </main>
    );
  }

  const entradas = data?.pages.flat() ?? [];

  return (
    <main className="flex flex-col gap-4 px-5 py-5">
      <div>
        <h1 className="text-[24px] font-extrabold">Análise</h1>
        <p className="text-sm text-fg-muted">
          {aba === "auditoria" ? "Log de auditoria · somente leitura" : "Histórico de contagens por data"}
        </p>
      </div>

      <div className="flex gap-2">
        <Chip ativo={aba === "auditoria"} onClick={() => setAba("auditoria")}>
          Auditoria
        </Chip>
        <Chip ativo={aba === "contagens"} onClick={() => setAba("contagens")}>
          Contagens
        </Chip>
      </div>

      {aba === "contagens" ? (
        <HistoricoContagens lojaId={lojaId} />
      ) : (
        <>
          {isLoading && <p className="text-sm text-fg-muted">Carregando...</p>}
          {!isLoading && entradas.length === 0 && (
            <p className="text-sm text-fg-muted">Nenhuma ação registrada ainda.</p>
          )}

          <div className="flex flex-col gap-2">
            {entradas.map((log) => (
              <button
                key={log.id}
                type="button"
                onClick={() => setLogSelecionado(log)}
                className="rounded-md border border-border px-3.5 py-3 text-left text-sm active:bg-surface-soft"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{LABEL_ACAO_AUDITORIA[log.acao] ?? log.acao}</span>
                  <span className="text-xs text-fg-muted">{formatarTimestamp(log.timestamp)}</span>
                </div>
                <p className="text-xs text-fg-muted">
                  {log.actorNome} · {log.actorPapel}
                  {log.entidadeTipo && ` · ${log.entidadeTipo}`}
                </p>
              </button>
            ))}
          </div>

          {hasNextPage && (
            <Button
              variant="secondary"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? "Carregando..." : "Carregar mais"}
            </Button>
          )}
        </>
      )}

      <AuditLogDetailModal
        log={logSelecionado}
        onClose={() => setLogSelecionado(null)}
        onVerAparelho={(id) => {
          setLogSelecionado(null);
          setAparelhoSelecionado(id);
        }}
      />

      <DeviceDetailSheet
        aparelhoId={aparelhoSelecionado}
        onClose={() => setAparelhoSelecionado(null)}
      />
    </main>
  );
}
