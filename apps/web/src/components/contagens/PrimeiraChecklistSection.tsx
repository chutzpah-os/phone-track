"use client";

import { useMemo, useState } from "react";
import type { Categoria, CountItem, CountRecord, StatusPrimeiraContagem } from "@phonetrack/shared";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { ContagemCounters } from "@/components/contagens/ContagemCounters";
import { ChecklistItemPrimeira } from "@/components/contagens/ChecklistItemPrimeira";
import {
  useFinalizarContagem,
  useItensContagem,
  useMarcarPresenca,
  useMarcarStatusItem,
} from "@/hooks/use-contagens";

const CATEGORIAS: { valor: Categoria; label: string }[] = [
  { valor: "lacrado", label: "Lacrados" },
  { valor: "seminovo", label: "Seminovos" },
  { valor: "americano", label: "Americanos" },
];

export function PrimeiraChecklistSection({
  lojaId,
  registro,
}: {
  lojaId: string | undefined;
  registro: CountRecord;
}) {
  const { data } = useItensContagem(lojaId, registro.id);
  const marcarPresenca = useMarcarPresenca(lojaId, registro.id);
  const marcarStatus = useMarcarStatusItem(lojaId, registro.id);
  const finalizar = useFinalizarContagem(lojaId, registro.id);
  const [confirmando, setConfirmando] = useState(false);
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

      {CATEGORIAS.map(({ valor, label }) => (
        <div key={valor} className="flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-wide text-fg-muted">
            {label} · {itensPorCategoria[valor].filter((i) => i.status === "presente").length}/
            {itensPorCategoria[valor].length}
          </p>
          {itensPorCategoria[valor].map((item) => (
            <ChecklistItemPrimeira
              key={item.deviceId}
              item={item}
              disabled={registro.finalizada}
              expanded={expandedId === item.deviceId}
              onToggle={() =>
                marcarPresenca.mutate({
                  deviceId: item.deviceId,
                  presente: item.status !== "presente",
                })
              }
              onToggleExpand={() =>
                setExpandedId(expandedId === item.deviceId ? null : item.deviceId)
              }
              onSelecionarMotivo={(
                status: Exclude<StatusPrimeiraContagem, "presente">,
                observacao?: string,
              ) => {
                marcarStatus.mutate({
                  deviceId: item.deviceId,
                  input: { status, observacao },
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
