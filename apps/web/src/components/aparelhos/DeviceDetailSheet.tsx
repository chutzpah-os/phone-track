"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { EditDeviceModal } from "@/components/aparelhos/EditDeviceModal";
import { useAuth } from "@/context/auth-context";
import { useAparelho, useExcluirAparelho } from "@/hooks/use-aparelhos";
import { LABEL_ORIGEM, LABEL_STATUS } from "@/lib/labels";
import { formatarDataBR } from "@/lib/format";

export function DeviceDetailSheet({
  aparelhoId,
  onClose,
}: {
  aparelhoId: string | null;
  onClose: () => void;
}) {
  const { perfil } = useAuth();
  const podeEditar = perfil?.papel === "master" || perfil?.papel === "admin";
  const { data, isLoading } = useAparelho(aparelhoId ?? undefined);
  const excluirAparelho = useExcluirAparelho(data?.aparelho.lojaId);
  const [editando, setEditando] = useState(false);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);

  return (
    <BottomSheet open={!!aparelhoId} onClose={onClose}>
      {isLoading && <p className="py-6 text-center text-sm text-fg-muted">Carregando...</p>}

      {data && (
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-extrabold">{data.aparelho.nome}</h2>
              <p className="text-xs text-fg-muted">
                {data.aparelho.marca} · {data.aparelho.modelo}
              </p>
            </div>
            <CategoryBadge categoria={data.aparelho.categoria} />
          </div>

          {!data.aparelho.ativo && (
            <div className="rounded-md bg-surface-soft px-3 py-2 text-xs text-fg-muted">
              Este aparelho está desativado (excluído ou saiu da loja).
            </div>
          )}

          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-fg-muted">Cor</dt>
            <dd className="text-right">{data.aparelho.cor ?? "—"}</dd>
            <dt className="text-fg-muted">IMEI</dt>
            <dd className="text-right">{data.aparelho.imei ?? "—"}</dd>
            {data.aparelho.descricao && (
              <>
                <dt className="text-fg-muted">Descrição</dt>
                <dd className="text-right">{data.aparelho.descricao}</dd>
              </>
            )}
          </dl>

          {podeEditar && (
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setEditando(true)}>
                Editar
              </Button>
              <Button
                variant="secondary"
                className="flex-1 border-red-600 text-red-600"
                onClick={() => setConfirmandoExclusao(true)}
              >
                Excluir
              </Button>
            </div>
          )}

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-fg-muted">
              Histórico · somente leitura
            </p>
            <div className="mt-2 flex flex-col gap-2">
              {data.historico.length === 0 && (
                <p className="text-sm text-fg-muted">
                  Nenhuma movimentação registrada ainda.
                </p>
              )}
              {data.historico.map((item, i) => (
                <div
                  key={i}
                  className="rounded-md border border-border bg-surface-soft px-3 py-2 text-sm"
                >
                  <span className="font-semibold">{formatarDataBR(item.data)}</span> — {LABEL_ORIGEM[item.origem]} ·{" "}
                  {LABEL_STATUS[item.status] ?? item.status}
                  {item.actorNome && <span className="text-fg-muted"> · {item.actorNome}</span>}
                  {item.observacao && (
                    <span className="block text-xs text-fg-muted">{item.observacao}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <EditDeviceModal
            open={editando}
            onClose={() => setEditando(false)}
            aparelho={data.aparelho}
          />

          <ConfirmModal
            open={confirmandoExclusao}
            onClose={() => setConfirmandoExclusao(false)}
            perguntaInicial="Excluir este aparelho?"
            perguntaFinal="Tem certeza? Ele deixará de aparecer na Lista e nas próximas contagens."
            confirmando={excluirAparelho.isPending}
            onConfirm={async () => {
              await excluirAparelho.mutateAsync(data.aparelho.id);
              setConfirmandoExclusao(false);
              onClose();
            }}
          />
        </div>
      )}
    </BottomSheet>
  );
}
