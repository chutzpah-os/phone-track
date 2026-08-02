"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  perguntaInicial,
  perguntaFinal,
  confirmando,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  perguntaInicial: string;
  perguntaFinal: string;
  confirmando?: boolean;
}) {
  const [etapa, setEtapa] = useState<1 | 2>(1);

  function fechar() {
    setEtapa(1);
    onClose();
  }

  return (
    <Modal open={open} onClose={fechar}>
      <p className="text-center text-[15px] font-semibold">
        {etapa === 1 ? perguntaInicial : perguntaFinal}
      </p>
      <div className="mt-4 flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={fechar}>
          Cancelar
        </Button>
        {etapa === 1 ? (
          <Button className="flex-1" onClick={() => setEtapa(2)}>
            Continuar
          </Button>
        ) : (
          <Button className="flex-1" onClick={onConfirm} disabled={confirmando}>
            {confirmando ? "Confirmando..." : "Confirmar"}
          </Button>
        )}
      </div>
    </Modal>
  );
}
