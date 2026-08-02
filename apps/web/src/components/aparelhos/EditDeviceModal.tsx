"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  criarAparelhoSchema,
  type Aparelho,
  type Categoria,
  type CriarAparelhoInput,
} from "@phonetrack/shared";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useAtualizarAparelho } from "@/hooks/use-aparelhos";

const CATEGORIAS: { valor: Categoria; label: string }[] = [
  { valor: "lacrado", label: "Lacrado" },
  { valor: "seminovo", label: "Seminovo" },
  { valor: "americano", label: "Americano" },
];

export function EditDeviceModal({
  open,
  onClose,
  aparelho,
}: {
  open: boolean;
  onClose: () => void;
  aparelho: Aparelho;
}) {
  const atualizarAparelho = useAtualizarAparelho(aparelho.lojaId);
  const [erro, setErro] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CriarAparelhoInput>({
    resolver: zodResolver(criarAparelhoSchema),
    defaultValues: {
      nome: aparelho.nome,
      marca: aparelho.marca,
      modelo: aparelho.modelo,
      categoria: aparelho.categoria,
      cor: aparelho.cor,
      imei: aparelho.imei,
      descricao: aparelho.descricao,
    },
  });

  const categoriaSelecionada = watch("categoria");

  function fechar() {
    setErro(null);
    onClose();
  }

  async function onSubmit(data: CriarAparelhoInput) {
    setErro(null);
    try {
      await atualizarAparelho.mutateAsync({ id: aparelho.id, input: data });
      fechar();
    } catch {
      setErro("Não foi possível salvar as alterações. Tente novamente.");
    }
  }

  return (
    <Modal open={open} onClose={fechar}>
      <h2 className="text-[17px] font-extrabold">Editar aparelho</h2>

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

        <input
          placeholder="Cor (opcional)"
          className="rounded-md border-[1.5px] border-border px-3 py-2.5 text-sm outline-none focus:border-fg"
          {...register("cor")}
        />

        <input
          placeholder="IMEI (opcional)"
          className="rounded-md border-[1.5px] border-border px-3 py-2.5 text-sm outline-none focus:border-fg"
          {...register("imei")}
        />

        <input
          placeholder="Descrição (opcional)"
          className="rounded-md border-[1.5px] border-border px-3 py-2.5 text-sm outline-none focus:border-fg"
          {...register("descricao")}
        />

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
          <Button type="submit" className="flex-1" disabled={atualizarAparelho.isPending}>
            {atualizarAparelho.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
