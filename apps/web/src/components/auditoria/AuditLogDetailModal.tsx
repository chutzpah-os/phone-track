"use client";

import type { AuditLog } from "@phonetrack/shared";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { LABEL_ACAO_AUDITORIA, LABEL_ORIGEM, LABEL_STATUS } from "@/lib/labels";

const LABEL_CHAVE_DETALHE: Record<string, string> = {
  tipo: "Tipo",
  data: "Data",
  recordId: "Registro",
  motivo: "Motivo",
};

function formatarChave(chave: string): string {
  return LABEL_CHAVE_DETALHE[chave] ?? chave.charAt(0).toUpperCase() + chave.slice(1);
}

function formatarValor(chave: string, valor: unknown): string {
  if (typeof valor !== "string") return JSON.stringify(valor);
  if (chave === "tipo") return LABEL_ORIGEM[valor] ?? valor;
  if (chave === "motivo") return LABEL_STATUS[valor] ?? valor;
  return valor;
}

function formatarTimestampCompleto(valor: unknown): string {
  const ts = valor as { _seconds?: number } | string | undefined;
  if (ts && typeof ts === "object" && typeof ts._seconds === "number") {
    return new Date(ts._seconds * 1000).toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "medium" });
  }
  if (typeof ts === "string") {
    return new Date(ts).toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "medium" });
  }
  return "—";
}

function Campo({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10.5px] font-bold uppercase tracking-wide text-fg-muted">{label}</span>
      <span className="text-sm">{valor}</span>
    </div>
  );
}

export function AuditLogDetailModal({
  log,
  onClose,
  onVerAparelho,
}: {
  log: AuditLog | null;
  onClose: () => void;
  onVerAparelho: (aparelhoId: string) => void;
}) {
  const detalhesEntradas = log?.detalhes ? Object.entries(log.detalhes) : [];

  return (
    <Modal open={!!log} onClose={onClose}>
      {log && (
        <div className="flex flex-col gap-3">
          <p className="text-[17px] font-extrabold">
            {LABEL_ACAO_AUDITORIA[log.acao] ?? log.acao}
          </p>

          <Campo label="Quando" valor={formatarTimestampCompleto(log.timestamp)} />
          <Campo label="Responsável" valor={`${log.actorNome} · ${log.actorPapel}`} />

          {log.entidadeTipo && (
            <Campo
              label="Entidade"
              valor={`${log.entidadeTipo}${log.entidadeId ? ` · ${log.entidadeId}` : ""}`}
            />
          )}

          {detalhesEntradas.length > 0 ? (
            <div className="flex flex-col gap-2 rounded-md border border-border px-3 py-2.5">
              {detalhesEntradas.map(([chave, valor]) => (
                <Campo key={chave} label={formatarChave(chave)} valor={formatarValor(chave, valor)} />
              ))}
            </div>
          ) : (
            <p className="text-xs text-fg-muted">Nenhum detalhe adicional registrado.</p>
          )}

          {log.entidadeTipo === "aparelho" && log.entidadeId && (
            <Button onClick={() => onVerAparelho(log.entidadeId!)}>Ver aparelho</Button>
          )}

          <Button variant="secondary" onClick={onClose}>
            Fechar
          </Button>
        </div>
      )}
    </Modal>
  );
}
