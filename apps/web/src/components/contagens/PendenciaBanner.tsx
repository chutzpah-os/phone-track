"use client";

import type { CountRecord } from "@phonetrack/shared";
import { Button } from "@/components/ui/Button";
import { useDesbloquearPendencia } from "@/hooks/use-contagens";

export function PendenciaBanner({
  lojaId,
  pendencia,
  podeDesbloquear,
}: {
  lojaId: string | undefined;
  pendencia: CountRecord;
  podeDesbloquear: boolean;
}) {
  const desbloquear = useDesbloquearPendencia(lojaId);

  return (
    <div className="rounded-md border-[1.5px] border-fg bg-surface-soft px-4 py-3 text-sm">
      <p>
        ⚠ Existe uma contagem pendente de {pendencia.data}. Resolva antes de continuar.
      </p>
      {podeDesbloquear ? (
        <Button
          className="mt-3 w-full"
          onClick={() => desbloquear.mutate(pendencia.id)}
          disabled={desbloquear.isPending}
        >
          {desbloquear.isPending ? "Desbloqueando..." : "Desbloquear"}
        </Button>
      ) : (
        <p className="mt-2 text-xs text-fg-muted">Fale com um Admin ou Master para desbloquear.</p>
      )}
    </div>
  );
}
