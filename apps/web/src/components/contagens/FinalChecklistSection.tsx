"use client";

import { useMemo, useState } from "react";
import type { Categoria, CountItem, CountRecord, StatusContagemFinal } from "@phonetrack/shared";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { ContagemCounters } from "@/components/contagens/ContagemCounters";
import { ChecklistItemFinal } from "@/components/contagens/ChecklistItemFinal";
import { AddDeviceDuringCloseModal } from "@/components/contagens/AddDeviceDuringCloseModal";
import { useFinalizarContagem, useItensContagem, useMarcarStatusItem } from "@/hooks/use-contagens";

const CATEGORIAS: { valor: Categoria; label: string }[] = [
  { valor: "lacrado", label: "Lacrados" },
  { valor: "seminovo", label: "Seminovos" },
  { valor: "americano", label: "Americanos" },
];

export function FinalChecklistSection({
  lojaId,
  registro,
  permitirAdicionarAparelho,
}: {
  lojaId: string | undefined;
  registro: CountRecord;
  permitirAdicionarAparelho: boolean;
}) {
  const { data } = useItensContagem(lojaId, registro.id);
  const marcarStatus = useMarcarStatusItem(lojaId, registro.id);
  const finalizar = useFinalizarContagem(lojaId, registro.id);
  const [confirmando, setConfirmando] = useState(false);
  const [modalAparelhoAberto, setModalAparelhoAberto] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const itensPorCategoria = useMemo(() => {
    const mapa: Record<Categoria, CountItem[]> = { lacrado: [], seminovo: [], americano: [] };
    for (const item of data?.itens ?? []) mapa[item.categoria].push(item);
    return mapa;
  }, [data]);

  return (
    <div className="flex flex-col gap-4">
      <ContagemCounters contadores={registro.contadores} />

      {registro.finalizada && (
        <div className="rounded-md bg-surface-soft px-4 py-3 text-sm">✅ Contagem finalizada</div>
      )}

      {!registro.finalizada && permitirAdicionarAparelho && (
        <Button variant="secondary" onClick={() => setModalAparelhoAberto(true)}>
          + Adicionar aparelho
        </Button>
      )}

      {CATEGORIAS.map(({ valor, label }) => (
        <div key={valor} className="flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-wide text-fg-muted">
            {label} · {itensPorCategoria[valor].filter((i) => i.status).length}/
            {itensPorCategoria[valor].length}
          </p>
          {itensPorCategoria[valor].map((item) => (
            <ChecklistItemFinal
              key={item.deviceId}
              item={item}
              expanded={expandedId === item.deviceId}
              disabled={registro.finalizada}
              onToggleExpand={() =>
                setExpandedId(expandedId === item.deviceId ? null : item.deviceId)
              }
              onSelecionarStatus={(novoStatus: StatusContagemFinal, observacao?: string) => {
                marcarStatus.mutate({
                  deviceId: item.deviceId,
                  input: { status: novoStatus, observacao },
                });
                setExpandedId(null);
              }}
            />
          ))}
        </div>
      ))}

      {!registro.finalizada && (
        <Button onClick={() => setConfirmando(true)}>Finalizar Contagem</Button>
      )}

      {permitirAdicionarAparelho && (
        <AddDeviceDuringCloseModal
          open={modalAparelhoAberto}
          onClose={() => setModalAparelhoAberto(false)}
          lojaId={lojaId}
          recordId={registro.id}
        />
      )}

      <ConfirmModal
        open={confirmando}
        onClose={() => setConfirmando(false)}
        perguntaInicial="Finalizar contagem?"
        perguntaFinal="Tem certeza? Essa ação não poderá ser editada depois."
        confirmando={finalizar.isPending}
        onConfirm={async () => {
          await finalizar.mutateAsync([]);
          setConfirmando(false);
        }}
      />
    </div>
  );
}
