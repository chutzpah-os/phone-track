"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  adicionarAparelhoDuranteFechamentoSchema,
  type AdicionarAparelhoDuranteFechamentoInput,
  type Categoria,
} from "@phonetrack/shared";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useAdicionarAparelhoFechamento } from "@/hooks/use-contagens";

const CATEGORIAS: { valor: Categoria; label: string }[] = [
  { valor: "lacrado", label: "Lacrado" },
  { valor: "seminovo", label: "Seminovo" },
  { valor: "americano", label: "Americano" },
];

export function AddDeviceDuringCloseModal({
  open,
  onClose,
  lojaId,
  recordId,
}: {
  open: boolean;
  onClose: () => void;
  lojaId: string | undefined;
  recordId: string | undefined;
}) {
  const adicionar = useAdicionarAparelhoFechamento(lojaId, recordId);
  const [erro, setErro] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AdicionarAparelhoDuranteFechamentoInput>({
    resolver: zodResolver(adicionarAparelhoDuranteFechamentoSchema),
    defaultValues: { categoria: "lacrado" },
  });

  const categoriaSelecionada = watch("categoria");

  function fechar() {
    reset();
    setErro(null);
    onClose();
  }

  async function onSubmit(data: AdicionarAparelhoDuranteFechamentoInput) {
    setErro(null);
    try {
      await adicionar.mutateAsync(data);
      fechar();
    } catch {
      setErro("Não foi possível adicionar o aparelho. Tente novamente.");
    }
  }

  return (
    <Modal open={open} onClose={fechar}>
      <h2 className="text-[17px] font-extrabold">Adicionar aparelho</h2>
      <p className="mt-1 text-xs text-fg-muted">
        Aparelho chegou hoje e não estava na Primeira Contagem.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 flex flex-col gap-3">
        <input
          placeholder="Nome (ex: iPhone 13)"
          className="rounded-md border-[1.5px] border-border px-3 py-2.5 text-sm outline-none focus:border-fg"
          {...register("nome")}
        />
        {errors.nome && <span className="text-xs text-red-600">{errors.nome.message}</span>}

        <input
          placeholder="Marca"
          className="rounded-md border-[1.5px] border-border px-3 py-2.5 text-sm outline-none focus:border-fg"
          {...register("marca")}
        />
        {errors.marca && <span className="text-xs text-red-600">{errors.marca.message}</span>}

        <input
          placeholder="Modelo"
          className="rounded-md border-[1.5px] border-border px-3 py-2.5 text-sm outline-none focus:border-fg"
          {...register("modelo")}
        />
        {errors.modelo && <span className="text-xs text-red-600">{errors.modelo.message}</span>}

        <div className="grid grid-cols-3 gap-1.5">
          {CATEGORIAS.map((cat) => (
            <button
              key={cat.valor}
              type="button"
              onClick={() => setValue("categoria", cat.valor, { shouldValidate: true })}
              className={`rounded-md py-2 text-xs font-bold ${
                categoriaSelecionada === cat.valor
                  ? "bg-fg text-accent"
                  : "border-[1.5px] border-border bg-bg text-fg"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {erro && <p className="text-xs text-red-600">{erro}</p>}

        <div className="mt-2 flex gap-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={fechar}>
            Cancelar
          </Button>
          <Button type="submit" className="flex-1" disabled={adicionar.isPending}>
            {adicionar.isPending ? "Adicionando..." : "Adicionar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
