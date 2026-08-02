"use client";

import { useMemo, useState } from "react";
import type { Categoria } from "@phonetrack/shared";
import { Chip } from "@/components/ui/Chip";
import { SearchInput } from "@/components/ui/SearchInput";
import { Button } from "@/components/ui/Button";
import { DeviceCard } from "@/components/ui/DeviceCard";
import { AddDeviceModal } from "@/components/aparelhos/AddDeviceModal";
import { DeviceDetailSheet } from "@/components/aparelhos/DeviceDetailSheet";
import { useLojaAtual } from "@/hooks/use-loja-atual";
import { useAparelhos } from "@/hooks/use-aparelhos";

type FiltroCategoria = "todos" | Categoria;

const FILTROS: { valor: FiltroCategoria; label: string }[] = [
  { valor: "todos", label: "Todos" },
  { valor: "lacrado", label: "Lacrados" },
  { valor: "seminovo", label: "Seminovos" },
  { valor: "americano", label: "Americanos" },
];

export default function ListaAparelhosPage() {
  const { lojaId, carregando: carregandoLoja } = useLojaAtual();
  const { data: aparelhos, isLoading } = useAparelhos(lojaId);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<FiltroCategoria>("todos");
  const [modalAberto, setModalAberto] = useState(false);
  const [aparelhoSelecionado, setAparelhoSelecionado] = useState<string | null>(null);

  const contadores = useMemo(() => {
    const base = { todos: 0, lacrado: 0, seminovo: 0, americano: 0 };
    for (const a of aparelhos ?? []) {
      base[a.categoria]++;
      base.todos++;
    }
    return base;
  }, [aparelhos]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return (aparelhos ?? []).filter((a) => {
      if (filtro !== "todos" && a.categoria !== filtro) return false;
      if (!termo) return true;
      return (
        a.nome.toLowerCase().includes(termo) ||
        a.marca.toLowerCase().includes(termo) ||
        a.modelo.toLowerCase().includes(termo) ||
        a.imei?.toLowerCase().includes(termo)
      );
    });
  }, [aparelhos, busca, filtro]);

  return (
    <main className="flex flex-col gap-4 px-5 py-5">
      <div>
        <h1 className="text-[24px] font-extrabold">Aparelhos</h1>
        <p className="text-sm text-fg-muted">{contadores.todos} cadastrados</p>
      </div>

      <SearchInput
        placeholder="Buscar por nome, marca, modelo ou IMEI"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />

      <div className="flex flex-wrap gap-2">
        {FILTROS.map((f) => (
          <Chip key={f.valor} ativo={filtro === f.valor} onClick={() => setFiltro(f.valor)}>
            {f.label} ({contadores[f.valor]})
          </Chip>
        ))}
      </div>

      <Button onClick={() => setModalAberto(true)}>+ Adicionar aparelho</Button>

      <div className="flex flex-col gap-2.5">
        {(carregandoLoja || isLoading) && (
          <p className="py-6 text-center text-sm text-fg-muted">Carregando...</p>
        )}
        {!isLoading && filtrados.length === 0 && (
          <p className="py-6 text-center text-sm text-fg-muted">Nenhum aparelho encontrado.</p>
        )}
        {filtrados.map((aparelho) => (
          <DeviceCard
            key={aparelho.id}
            aparelho={aparelho}
            onClick={() => setAparelhoSelecionado(aparelho.id)}
          />
        ))}
      </div>

      <AddDeviceModal
        open={modalAberto}
        onClose={() => setModalAberto(false)}
        lojaId={lojaId}
      />
      <DeviceDetailSheet
        aparelhoId={aparelhoSelecionado}
        onClose={() => setAparelhoSelecionado(null)}
      />
    </main>
  );
}
